import { Injectable, Logger } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '@infra/prisma/prisma.service';
import _ from 'lodash';
import { generateHash } from './generateHash';

import { CreditCardInput, CurrentAccountInput } from './handler-transactions.service';
import { TipoCategoria, TipoTransacao } from '@prisma/client';
import { chronoParse } from './chrono';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    readonly prismaService: PrismaService,
  ) { }

  create(createTransactionDto: CreateTransactionDto) {
    this.logger.debug('Criando uma nova transação');
    return 'Esta ação adiciona uma nova transação';
  }

  findAll() {
    this.logger.debug('Retornando todas as transações');
    return `Esta ação retorna todas as transações`;
  }

  findOne(id: number) {
    this.logger.debug(`Retornando transação com id: ${id}`);
    return `Esta ação retorna a transação #${id}`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    this.logger.debug(`Atualizando transação com id: ${id}`);
    return `Esta ação atualiza a transação #${id}`;
  }

  async createCurrentAccountTransaction(input: CurrentAccountInput, tenantId: number): Promise<void> {
    for (const transacao of input.transacoes) {
      try {
        const data = await chronoParse(transacao.data);
        if (!data) {
          this.logger.warn(`Data inválida para transação: ${JSON.stringify(transacao)}`);
          continue;
        }
        this.logger.debug(`Criando transação bancária: ${JSON.stringify(transacao)}`);
        const hash = generateHash(`${transacao.data}${transacao.descricao.substring(0, 5).toUpperCase()}${transacao.credito}${transacao.debito}${transacao.saldo}`);
        const existingTransaction = await this.prismaService.transacoes.findFirst({
          where: {
            id: hash,
            tenantId,
          },
        });
        if (existingTransaction) {
          this.logger.debug(`Transação já existe: ${existingTransaction.id}`);
          continue;
        }
        await this.prismaService.transacoes.create({
          data: {
            id: hash,
            data: data,
            descricao: transacao.descricao,
            banco: transacao.banco.toUpperCase(),
            valor: transacao.credito || transacao.debito,
            tipo: transacao.credito ? TipoTransacao.RECEITA : TipoTransacao.DESPESA,
            categoria: TipoCategoria[transacao.categoria] || TipoCategoria.OUTROS,
            tenantId,
          },
        });
      } catch (error) {
        this.logger.error(`Erro ao criar transação bancária: ${JSON.stringify(transacao)}`, error);
      }
    }
    return;
  }

  async createCreditCardTransaction(input: CreditCardInput, tenantId: number): Promise<void> {
    for (const transacao of input.transacoes) {
      try {
        const data = await chronoParse(transacao.data);
        if (!data) {
          this.logger.warn(`Data inválida para transação: ${JSON.stringify(transacao)}`);
          continue;
        }
        this.logger.debug(`Criando transação de cartão de crédito: ${JSON.stringify(transacao)}`);
        const hash = generateHash(`${transacao.data}${transacao.descricao.substring(0, 5).toUpperCase()}${transacao.parcela}${transacao.valor_brl}`);
        const existingTransaction = await this.prismaService.transacoes.findFirst({
          where: {
            id: hash,
            tenantId,
          },
        });
        if (existingTransaction) {
          this.logger.debug(`Transação de cartão de crédito já existe: ${existingTransaction.id}`);
          continue;
        }
        await this.prismaService.transacoesCartaoCredito.create({
          data: {
            id: hash,
            data: data,
            descricao: transacao.descricao,
            categoria: TipoCategoria[transacao.categoria] || TipoCategoria.OUTROS,
            valor: transacao.valor_brl,
            banco: input.banco.toUpperCase(),
            tenantId,
          },
        });
      } catch (error) {
        this.logger.error(`Erro ao criar transação de cartão de crédito: ${JSON.stringify(transacao)}`, error);
      }
    }
  }
}

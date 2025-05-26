import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@infra/prisma/prisma.service';
import { TipoArquivo, TipoCategoria, TipoStatus } from '@prisma/client';
import { CurrentAccountTransactionsUploadService } from './current-account-transactions.upload';
import { CreditCardTransactionsUploadService } from './credit-card-transactions.upload';
import _ from 'lodash';
import { generateHash } from './generateHash';
import { TransactionsService } from './transactions.service';

@Injectable()
export class HandlerTransactionsService {
  private readonly logger = new Logger(HandlerTransactionsService.name);

  constructor(
    readonly prismaService: PrismaService,
    readonly currentAccountTransactionsUploadService: CurrentAccountTransactionsUploadService,
    readonly creditCardTransactionsUploadService: CreditCardTransactionsUploadService,
    readonly transactionsService: TransactionsService
  ) { }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handlerTransactions() {
    this.logger.log('Iniciando o job handlerTransactions');
    const files = await this.prismaService.arquivos.findMany({
      where: {
        status: TipoStatus.PENDENTE,
      },
      select: {
        id: true,
        tipo: true,
      },
      orderBy: {
        dataUpload: 'asc',
      },
      take: 5,
    });

    this.logger.debug(`Encontrados ${files.length} arquivos pendentes`);

    for (const file of files) {
      this.logger.debug(`Processando arquivo com id: ${file.id}, tipo: ${file.tipo}`);
      const fileDetails = await this.prismaService.arquivos.findUnique({
        where: { id: file.id },
      });

      if (file.tipo === TipoArquivo.EXTRATO_BANCARIO) {
        this.logger.debug(`Arquivo ${file.id} é um extrato bancário`);
        await this.prismaService.arquivos.update({
          where: { id: file.id },
          data: { status: TipoStatus.PROCESSANDO },
        });
        this.logger.debug(`Arquivo ${file.id} status atualizado para PROCESSANDO`);
        const [res1, res2] = await Promise.all([
          this.currentAccountTransactionsUploadService.uploadFile(Buffer.from(fileDetails.conteudo).toString('base64')),
          this.currentAccountTransactionsUploadService.uploadFile(Buffer.from(fileDetails.conteudo).toString('base64')),
        ]);


        const bodyHash = (transacoes: CurrentAccountTransaction) =>
          (generateHash(`${transacoes.data}${transacoes.descricao.substring(0, 5)}${transacoes.credito}${transacoes.debito}${transacoes.saldo}`))
        const areEqual = _.isEqual(res1.transacoes.map(bodyHash), res2.transacoes.map(bodyHash));
        this.logger.debug(`Resultados do upload para o arquivo ${file.id}: res1=${JSON.stringify(res1)}, res2=${JSON.stringify(res2)}`);
        this.logger.debug(`Resultado da comparação para o arquivo ${file.id}: ${areEqual}`);
        if (areEqual) {
          await this.prismaService.arquivos.update({
            where: { id: file.id },
            data: { status: TipoStatus.CONCLUIDO },
          });
          this.logger.log(`Arquivo ${file.id} status atualizado para CONCLUIDO`);
          await this.transactionsService.createCurrentAccountTransaction(res1, fileDetails.tenantId);
        } else {
          await this.prismaService.arquivos.update({
            where: { id: file.id },
            data: { status: TipoStatus.PENDENTE },
          });
          this.logger.warn(`Resultados do upload do arquivo ${file.id} não são iguais, status revertido para PENDENTE`);
        }
      } else if (file.tipo === TipoArquivo.FATURA_CARTAO_CREDITO) {
        this.logger.debug(`Arquivo ${file.id} é uma fatura de cartão de crédito`);
        const [res1, res2] = await Promise.all([
          await this.creditCardTransactionsUploadService.uploadFile(Buffer.from(fileDetails.conteudo).toString('base64')),
          await this.creditCardTransactionsUploadService.uploadFile(Buffer.from(fileDetails.conteudo).toString('base64')),
        ]);

        const bodyHash = (transacoes: CreditCardTransaction) => (generateHash(`${transacoes.data}${transacoes.descricao.substring(0, 5)}${transacoes.parcela}${transacoes.valor_brl}`));
        this.logger.debug(`Resultados do upload para o arquivo ${file.id}: res1=${JSON.stringify(res1)}, res2=${JSON.stringify(res2)}`);
        const areEqual = _.isEqual(res1.transacoes.map(bodyHash), res2.transacoes.map(bodyHash));
        this.logger.debug(`Hash das transações do arquivo ${file.id}: res1=${res1.transacoes.map(bodyHash)}, res2=${res2.transacoes.map(bodyHash)}`);
        this.logger.debug(`Resultado da comparação para o arquivo ${file.id}: ${areEqual}`);
        if (areEqual) {
          await this.prismaService.arquivos.update({
            where: { id: file.id },
            data: { status: TipoStatus.CONCLUIDO },
          });
          this.logger.log(`Arquivo ${file.id} status atualizado para CONCLUIDO`);
          await this.transactionsService.createCreditCardTransaction(res1, fileDetails.tenantId);
        }
        else {
          await this.prismaService.arquivos.update({
            where: { id: file.id },
            data: { status: TipoStatus.PENDENTE },
          });
          this.logger.warn(`Resultados do upload do arquivo ${file.id} não são iguais, status revertido para PENDENTE`);
        }
      }
    }
    this.logger.log('Handler de transações executado com sucesso');
    return 'Handler de transações executado com sucesso';
  }
}

interface CurrentAccountTransaction {
  banco?: string;
  data?: string;
  descricao?: string;
  categoria?: string;
  credito?: number;
  debito?: number;
  saldo?: number;
}

interface CreditCardTransaction {
  data?: string;
  descricao?: string;
  categoria?: string;
  parcela?: string;
  valor_brl?: number;
}

export interface CurrentAccountInput {
  transacoes?: CurrentAccountTransaction[];
}

export interface CreditCardInput {
  transacoes?: CreditCardTransaction[];
  banco?: string;
  data_extrato?: string;
}
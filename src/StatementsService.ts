import { Injectable } from '@nestjs/common';
import { PrismaService } from './infra/prisma/prisma.service';
import { createHash } from 'crypto';
import * as dayjs from 'dayjs';
import { Category } from '@prisma/client';
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

interface Statement {
  data: string; // DD/MM/YYYY
  descricao: string;
  credito: number;
  debito: number;
  saldo: number;
  categoria: Category;
}

@Injectable()
export class StatementsService {
  constructor(private prisma: PrismaService) { }
  async insertStatements(statements: Statement[]) {
    for (const statement of statements) {
      try {
        const hash = this.gerarHash(`${statement.data}${statement.credito}${statement.debito}${statement.saldo}`)
        const statementHash = await this.prisma.bankStatement.findFirst({
          where: {
            hash: hash,
          },
        })
        if (statementHash) {
          console.log('Lançamento já existe:', statementHash);
          continue;
        }
        const date = dayjs(statement.data, 'DD/MM/YYYY').toDate()
        console.log('Data original:', statement.data, '| Data convertida:', date)
        await this.prisma.bankStatement.create({
          data: {
            date: date,
            history: statement.descricao,
            credit: statement.credito,
            debit: statement.debito,
            balance: statement.saldo,
            category: Category[statement.categoria] || Category.OUTROS,
            hash,
            mode: 'CONTA_CORRENTE',
            type: statement.debito > 0 ? 'PAGAMENTO' : 'RECEBIMENTO',
          },
        }).catch((e) => {
          console.error('Erro ao criar lançamento no banco:', e)
        })
      } catch (e) {
        console.error('Erro ao processar lançamento:', e)
      }
    }
  }

  async insertStatementsCredit(statements: Extrato) {
    console.log('insertStatementsCredit chamado com:', JSON.stringify(statements, null, 2));
    for (const [index, statement] of statements.transacoes.entries()) {
      try {
        console.log(`Processando transação #${index}:`, JSON.stringify(statement, null, 2));
        const hashInput = `${statement.data}${statement.descricao}${statement.valor_brl}`;
        const hash = this.gerarHash(hashInput);
        console.log(`Hash gerado para entrada: ${hashInput}, hash: ${hash}`);
        
        const statementHash = await this.prisma.bankStatement.findFirst({
          where: {
            hash: hash,
          },
        })
        if (statementHash) {
          console.log('Transação já existe:', statementHash);
          continue;
        }

        // pegar ano statements.data_extrato e concatenar com statement.data
        const ano = statements.data_extrato.split('/')[2];
        console.log(`Ano extraído de data_extrato: ${ano}`);

        const fullDateStr = statement.data + '/' + ano;
        const date = dayjs(fullDateStr, 'DD/MM/YYYY').toDate();
        console.log(`Data formatada: ${fullDateStr} | Objeto Date:`, date);

        const category = Category[statement.categoria] || Category.OUTROS;
        console.log(`Categoria resolvida: ${statement.categoria} -> ${category}`);

        const dataToInsert = {
          date: date,
          history: statement.descricao,
          credit: 0,
          debit: statement.valor_brl,
          balance: 0,
          category: Category[statement.categoria] || Category.OUTROS,
          hash,
          mode: 'CARTAO_CREDITO',
          type: 'PAGAMENTO',
        };
        console.log('Dados a serem inseridos em bankStatement:', JSON.stringify(dataToInsert, null, 2));

        await this.prisma.bankStatement.create({
          data: dataToInsert as any,
        }).catch((e) => {
          console.error('Erro ao criar transação no banco:', e);
        });
      } catch (e) {
        console.error('Erro ao processar transação:', e);
      }
    }
    console.log('insertStatementsCredit finalizou o processamento de todas as transações.');
  }

  private gerarHash(data: string) {
    return createHash('sha256').update(data).digest('hex');
  }
}


interface Transacao {
  data: string; // DD/MM/YYYY
  descricao: string;
  valor_brl: number;
  valor_usd: number | null;
  categoria: Category
}

interface Extrato {
  aplicativo: string;
  cartao: string;
  data_extrato: string; // DD/MM/YYYY
  hora: string;
  situacao: string;
  titular: string;
  total_brl: number;
  transacoes: Transacao[];
}

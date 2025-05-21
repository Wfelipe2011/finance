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
        const date = dayjs(statement.data, 'DD/MM/YYYY').toDate()
        console.log('date', statement.data, date)
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
          console.error(e)
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  async insertStatementsCredit(statements: Extrato) {
    console.log('insertStatementsCredit called with:', JSON.stringify(statements, null, 2));
    for (const [index, statement] of statements.transacoes.entries()) {
      try {
        console.log(`Processing transaction #${index}:`, JSON.stringify(statement, null, 2));
        const hashInput = `${statement.data}${statement.descricao}${statement.valor_brl}`;
        const hash = this.gerarHash(hashInput);
        console.log(`Generated hash input: ${hashInput}, hash: ${hash}`);

        // pegar ano statements.data_extrato e concatenar com statement.data
        const ano = statements.data_extrato.split('/')[2];
        console.log(`Extracted year from data_extrato: ${ano}`);

        const fullDateStr = statement.data + '/' + ano;
        const date = dayjs(fullDateStr, 'DD/MM/YYYY').toDate();
        console.log(`Parsed date string: ${fullDateStr}, Date object:`, date);

        const category = Category[statement.categoria] || Category.OUTROS;
        console.log(`Resolved category: ${statement.categoria} -> ${category}`);

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
        console.log('Data to insert into bankStatement:', JSON.stringify(dataToInsert, null, 2));

        await this.prisma.bankStatement.create({
          data: dataToInsert as any,
        }).catch((e) => {
          console.error('Error in prisma.bankStatement.create:', e);
        });
      } catch (e) {
        console.error('Error processing transaction:', e);
      }
    }
    console.log('insertStatementsCredit finished processing all transactions.');
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

import { Injectable } from '@nestjs/common';
import { Statement } from './app.controller';
import { PrismaService } from './infra/prisma/prisma.service';
import { createHash } from 'crypto';
import * as dayjs from 'dayjs';
import { Category } from '@prisma/client';
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

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
            history: statement.historico,
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

  async insertStatementsCredit(statements: Statement[]) {
    for (const statement of statements) {
      try {
        const hash = this.gerarHash(`${statement.data}${statement.categoria}${statement.saldo}`)
        const date = dayjs(statement.data, 'DD/MM/YYYY').toDate()
        console.log('date', statement.data, date)
        await this.prisma.bankStatement.create({
          data: {
            date: date,
            history: statement.historico,
            credit: statement.credito,
            debit: statement.debito,
            balance: statement.saldo,
            category: Category[statement.categoria] || Category.OUTROS,
            hash,
            mode: 'CARTAO_CREDITO',
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

  private gerarHash(data: string) {
    return createHash('sha256').update(data).digest('hex');
  }
}

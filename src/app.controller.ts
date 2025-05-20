import { Body, Controller, Get, Post } from '@nestjs/common';
import { LeadsService } from './leads/leads.service';
import { StatementsService } from './StatementsService';

export interface Statement {
  data: string;
  historico: string;
  credito: number;
  debito: number;
  saldo: number;
  categoria: string;
}

@Controller()
export class AppController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly statementsService: StatementsService,
  ) { }

  @Get('leads')
  async refreshLeads() {
    return this.leadsService.refreshLeads();
  }

  @Post('statements')
  async refreshStatements(@Body() body: Statement[]) {
    return this.statementsService.insertStatements(body);
  }

  @Post('statements-credit')
  async statementsCredit(@Body() body: any) {
    return this.statementsService.insertStatementsCredit(body);
  }
}

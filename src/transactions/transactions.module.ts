import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { HttpModule } from '@nestjs/axios';
import { CurrentAccountTransactionsUploadService } from './current-account-transactions.upload';
import { CreditCardTransactionsUploadService } from './credit-card-transactions.upload';
import { HandlerTransactionsService } from './handler-transactions.service';

@Module({
  imports: [HttpModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, CurrentAccountTransactionsUploadService, CreditCardTransactionsUploadService, HandlerTransactionsService],
})
export class TransactionsModule {}

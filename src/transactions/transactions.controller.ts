import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentAccountTransactionsUploadService } from './current-account-transactions.upload';
import { CreditCardTransactionsUploadService } from './credit-card-transactions.upload';

@Controller('transactions')
export class TransactionsController {
  constructor(
    readonly transactionsService: TransactionsService,
    readonly currentAccountTransactionsUploadService: CurrentAccountTransactionsUploadService,
    readonly creditCardTransactionsUploadService: CreditCardTransactionsUploadService,
  ) { }

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(+id);
  }

  @Post('upload/current-account')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCurrentAccount(@UploadedFile() file: Express.Multer.File) {
    return this.currentAccountTransactionsUploadService.uploadFile(file);
  }

  @Post('upload/credit-card')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCreditCard(@UploadedFile() file: Express.Multer.File) {
    return this.creditCardTransactionsUploadService.uploadFile(file);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentAccountTransactionsUploadService } from './current-account-transactions.upload';
import { CreditCardTransactionsUploadService } from './credit-card-transactions.upload';
import { createHash } from 'crypto';
import { TipoArquivo } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';
import { UserToken } from '@auth/contracts';
import { PrismaService } from '@infra/prisma/prisma.service';
import e from 'express';

@Controller('transactions')
export class TransactionsController {
  constructor(
    readonly prismaService: PrismaService,
    readonly transactionsService: TransactionsService,
    readonly currentAccountTransactionsUploadService: CurrentAccountTransactionsUploadService,
    readonly creditCardTransactionsUploadService: CreditCardTransactionsUploadService,
    private readonly als: AsyncLocalStorage<UserToken>
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

  @Post('upload/current-account')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCurrentAccount(@UploadedFile() file: Express.Multer.File) {
    const id = this.generateHash(file.buffer);
    await this.prismaService.arquivos.create({
      data: {
        id,
        nome: file.originalname,
        tipo: TipoArquivo.EXTRATO_BANCARIO,
        conteudo: file.buffer,
        tenantId: this.als.getStore()['tenantId'],
      },
    }).catch(error => {
      if (error.code === 'P2002') {
        throw new ConflictException('Arquivo já existe');
      }
      throw new InternalServerErrorException('Erro ao salvar o arquivo', error);
    });
    return {
      message: 'Upload de transações bancárias iniciado'
    }
  }

  @Post('upload/credit-card')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCreditCard(@UploadedFile() file: Express.Multer.File) {
    const id = this.generateHash(file.buffer);
    await this.prismaService.arquivos.create({
      data: {
        id,
        nome: file.originalname,
        tipo: TipoArquivo.FATURA_CARTAO_CREDITO,
        conteudo: file.buffer,
        tenantId: this.als.getStore()['tenantId'],
      },
    }).catch(error => {
      if (error.code === 'P2002') {
        throw new ConflictException('Arquivo já existe');
      }
      throw new InternalServerErrorException('Erro ao salvar o arquivo', error);
    });
    return {
      message: 'Upload de transações de cartão de crédito iniciado',
    }
  }

  private generateHash(buffer: Buffer) {
    return createHash('sha256').update(buffer).digest('hex');
  }
}

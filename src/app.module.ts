import { Module } from '@nestjs/common';

import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from '@auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@auth/guard/auth.guard';

@Module({
  imports: [PrismaModule, AuthModule, TransactionsModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    }
  ],
})
export class AppModule { }

import { PrismaClient } from '@prisma/client';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(PrismaService.name);
  public isConnected = false;

  constructor() {
    super({ log: ['query'] });
  }

  async connectToDatabase() {
    if (this.isConnected) return;

    let retries = 5;
    while (retries > 0) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.logger.log('✅ Banco conectado com sucesso.');
        return;
      } catch (error) {
        this.logger.warn(`Tentativa ${6 - retries} de reconexão falhou: ${error['message']}`);
        retries--;
        await new Promise((res) => setTimeout(res, (5 - retries) * 1000));
      }
    }

    this.logger.error('❌ Não foi possível reconectar ao banco após várias tentativas.');
  }

  async onModuleInit() {
    await this.connectToDatabase();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.isConnected = false;
    this.logger.log('🔌 Conexão com o banco encerrada.');
  }
}

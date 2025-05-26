import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { PrismaModule } from './infra/prisma/prisma.module';
import { AuthModule } from '@auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@auth/guard/auth.guard';
import { AlsModule } from '@infra/prisma/als.module';
import { AsyncLocalStorage } from 'async_hooks';
import { UserToken } from '@auth/contracts';
import { Logger } from '@nestjs/common';

@Module({
  imports: [AlsModule, PrismaModule, AuthModule, TransactionsModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    }
  ],
})
export class AppModule implements NestModule {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    private readonly als: AsyncLocalStorage<UserToken>,
  ) { }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req, res, next) => {
        try {
          this.logger.debug(`[Middleware] Incoming request headers: ${JSON.stringify(req.headers)}`);
          const token = AuthGuard.extractTokenFromHeader(req)
          this.logger.debug(`[Middleware] Extracted token: ${token}`);
          if (token) {
            const payload = AuthGuard.validateToken(token);
            this.logger.debug(`[Middleware] Token payload: ${JSON.stringify(payload)}`);
            
            this.als.run(payload, () => {
              this.logger.debug(`[Middleware] ALS context set for user: ${JSON.stringify(payload)}`);
              next();
            });
          }
        } catch (error) {
          this.logger.debug('[Middleware] No token found, proceeding without ALS context');
          next();
        }
      })
      .forRoutes('*path');
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StatementsService } from './StatementsService';
import { LeadsService } from './leads/leads.service';
import { GoogleMapsScraper } from './scraper/google-maps.scraper';
import { PrismaModule } from './infra/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [StatementsService, LeadsService, GoogleMapsScraper],
})
export class AppModule { }

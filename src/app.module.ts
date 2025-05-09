import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { StatementsService } from './StatementsService';
import { LeadsService } from './leads/leads.service';
import { GoogleMapsScraper } from './scraper/google-maps.scraper';
import { PrismaModule } from './infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [StatementsService, LeadsService, GoogleMapsScraper],
})
export class AppModule { }

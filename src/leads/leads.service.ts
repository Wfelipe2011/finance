import { Injectable } from '@nestjs/common';
import { GoogleMapsScraper } from '../scraper/google-maps.scraper';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LeadsService {
    constructor(
        private scraper: GoogleMapsScraper,
        private prisma: PrismaService
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async refreshLeads() {
        await this.scraper.scrapeSorocabaLeads(async (params) => {
            for (const p of params) {
                if (!p.phone) continue
                await this.prisma.lead.upsert({
                    create: {
                        ...p,
                        phone: p.phone.replace(/[^0-9]/g, '')
                    },
                    update: {
                        ...p,
                        phone: p.phone.replace(/[^0-9]/g, '')
                    },
                    where: {
                        phone: p.phone.replace(/[^0-9]/g, '')
                    }
                }).catch((e) => console.error(e))
            }
        }).catch((e) => console.error(e));
        console.log('Leads refreshed');
    }
}
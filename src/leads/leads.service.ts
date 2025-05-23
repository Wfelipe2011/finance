import { Injectable } from '@nestjs/common';
import { GoogleMapsScraper } from '../scraper/google-maps.scraper';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class LeadsService {
    constructor(
        private scraper: GoogleMapsScraper,
        private prisma: PrismaService
    ) {
        console.log('[LeadsService] Constructor called');
    }

    // @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async refreshLeads() {
        console.log('[refreshLeads] Starting lead refresh...');
        await this.scraper.scrapeSorocabaLeads(async (params) => {
            for (const p of params) {
                if (!p.phone) {
                    console.log(`[refreshLeads] Skipping lead without phone:`, p);
                    continue;
                }
                const cleanPhone = p.phone.replace(/[^0-9]/g, '');
                try {
                    await this.prisma.lead.upsert({
                        create: { ...p, phone: cleanPhone },
                        update: { ...p, phone: cleanPhone },
                        where: { phone: cleanPhone }
                    });
                    console.log(`[refreshLeads] Upserted lead with phone: ${cleanPhone}`);
                } catch (e) {
                    console.error(`[refreshLeads] Error upserting lead with phone: ${cleanPhone}`, e);
                }
            }
        }).catch((e) => console.error('[refreshLeads] Error in scrapeSorocabaLeads:', e));
        console.log('[refreshLeads] Leads refreshed');
    }

    @Cron('0 12,17 * * 1-5')
    async contactLeads() {
        console.log('[contactLeads] Fetching leads to delete...');
        const leadsToDelete = await this.prisma.lead.findMany({
            where: {
                phone: { contains: "153" },
                contacted: false,
                deleted: false,
                category: {
                    notIn: [
                        'Agência Marketing Digital'
                    ]
                }
            },
        });
        console.log(`[contactLeads] Found ${leadsToDelete.length} leads to delete`);
        for (const lead of leadsToDelete) {
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: { deleted: true },
            });
            console.log(`[contactLeads] Marked lead as deleted: id=${lead.id}, phone=${lead.phone}`);
        }

        console.log('[contactLeads] Fetching leads to contact...');
        const leads = await this.prisma.lead.findMany({
            where: {
                contacted: false,
                deleted: false,
                OR: [
                    { website: "" },
                    { website: { contains: "facebo", mode: "insensitive" } },
                    { website: { contains: "instagra", mode: "insensitive" } },
                    { website: { contains: "sites", mode: "insensitive" } },
                    { website: { contains: "link", mode: "insensitive" } },
                    { website: { contains: "w.app", mode: "insensitive" } },
                    { website: { contains: "wixsite", mode: "insensitive" } },
                    { website: { contains: "wa.me", mode: "insensitive" } },
                    { website: { contains: "whatsapp", mode: "insensitive" } },
                ],
            },
        });
        console.log(`[contactLeads] Found ${leads.length} leads to contact`);
        const shuffledLeads = await this.shuffleLeads(leads);
        const leadsToContact = shuffledLeads.slice(0, 15);
        console.log('[contactLeads] Leads to contact:', leadsToContact.map(l => ({ id: l.id, phone: l.phone, website: l.website })));
        for(const lead of leadsToContact) {
           try {
            const greeting = `Olá, tudo bem?`;
            await this.sendMessage("55" + lead.phone, greeting);
           } catch (error) {
            console.error(`[contactLeads] Error processing lead ${lead.id}:`, error);
            continue;
           }
           await sleep(2000);
        }
        for (const lead of leadsToContact) {
            try {
            const messageText = message(lead.category);
            console.log(`[contactLeads] Sending message to ${lead.phone}:`, messageText);
            await this.sendMessage("55" + lead.phone, messageText);
            await this.prisma.lead.update({
                where: { id: lead.id },
                data: { contacted: true },
            });
            console.log(`[contactLeads] Marked lead as contacted: id=${lead.id}, phone=${lead.phone}`);
            } catch (error) {
                console.error(`[contactLeads] Error processing lead ${lead.id}:`, error);
                continue;
            }
            await sleep(10000);
        }
    }

    async responseLeads(body: { phoneNumber: string, textMessage: string }) {
        console.log('[responseLeads] Received response:', body);
        const { phoneNumber, textMessage } = body;
        const lead = await this.prisma.lead.findFirst({
            where: { 
                phone: {
                    contains: phoneNumber.replace(/[^0-9]/g, '').replace('55', ''),
                    mode: 'insensitive',
                }
            },
        });
        if (!lead) {
            console.log(`[responseLeads] Lead not found for phone number: ${phoneNumber}`);
            return;
        }
        await this.prisma.lead.update({
            where: { id: lead.id },
            data: { contacted: true, replied: true },
        });
        console.log(`[responseLeads] Marked lead as contacted and replied: id=${lead.id}, phone=${lead.phone}`);
    }

    async auth(): Promise<{ token: string }> {
        console.log('[auth] Authenticating...');
        const res = await fetch('https://baileys.wfelipe.com.br/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'insomnia/11.1.0',
            },
            body: JSON.stringify({
                username: process.env.WHATSAPP_USERNAME,
                password: process.env.WHATSAPP_PASSWORD,
            }),
        });
        const data = await res.json();
        console.log('[auth] Authenticated:', data);
        return data;
    }

    async sendMessage(phoneNumber: string, message: string) {
        console.log(`[sendMessage] Sending message to ${phoneNumber}`);
        const auth = await this.auth();
        const res = await fetch('https://baileys.wfelipe.com.br/whatsapp/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.token}`,
            },
            body: JSON.stringify({
                phoneNumber,
                message,
            }),
        });
        const data = await res.json();
        console.log(`[sendMessage] Message sent to ${phoneNumber}:`, data);
        return data;
    }

    async shuffleLeads(leads: any[]) {
        console.log(`[shuffleLeads] Shuffling ${leads.length} leads`);
        const shuffledLeads = leads.sort(() => Math.random() - 0.5);
        return shuffledLeads;
    }
}

function message(category: string): string {
    console.log(`[message] Generating message for category: ${category}`);
    const messages = {
        ["Clínicas odontológicas"]: `Eu sou a Giulia e trabalho com *criação e reformulação de sites profissionais*. 

Vi que talvez sua clínica odontológica esteja em busca de um *site novo* ou de uma *atualização no atual* — isso pode fazer *muita diferença* na hora de transmitir confiança e captar novos pacientes.

Se quiser, podemos *conversar melhor* e ver juntos o que faria mais sentido para a sua clínica.`,

        ["Clínicas médicas"]: `Me chamo Giulia e sou especialista em *criação e renovação de sites*. 

Pensei que talvez você esteja considerando *refazer o site* da sua clínica ou até mesmo *criar um do zero* — o que pode ajudar bastante na *divulgação* e na *atração de novos clientes*.

Se quiser podemos *conversar melhor* e ver juntos o que faria mais sentido para você, *estou à disposição.*`,
        ["Consultórios"]: `Me chamo Giulia e sou especialista em *criação e renovação de sites*. 

Pensei que talvez você esteja considerando *refazer o site* da sua clínica ou até mesmo *criar um do zero* — o que pode ajudar bastante na *divulgação* e na *atração de novos clientes*.

Se quiser podemos *conversar melhor* e ver juntos o que faria mais sentido para você, *estou à disposição.*`,

        ["Petshop"]: `Me chamo Giulia e sou especialista em *desenvolvimento de sites*. 

Estava pensando que talvez você esteja querendo *criar um site novo* ou *modernizar o atual* do seu petshop — algo que ajude a *destacar seus serviços* e *alcançar mais clientes online*.

Se fizer sentido pra você, posso te *explicar melhor* como funciona meu trabalho.`,

        ["Construtoras"]: `Eu sou a Giulia, e trabalho com *criação e renovação de sites profissionais*. 

Talvez seja um bom momento para *criar um site novo* ou *atualizar o atual* — uma ótima forma de *valorizar seus projetos* e *atrair novos clientes*.

Se quiser, podemos *bater um papo* para eu entender melhor o que você precisa.`,

        ["Advocacia"]: `Me chamo Giulia e sou especialista em *criação e reformulação de sites profissionais*. 

Notei que seu escritório pode estar pensando em *criar um novo site* ou *dar uma repaginada no atual* — isso ajuda muito a *transmitir credibilidade* e *atrair novos clientes*.

Se tiver interesse, podemos *conversar melhor* sobre como posso te ajudar com isso.`,
        ["Cursos de inglês"]: `Me chamo Giulia e sou especialista em *conteúdos digitais* e *criação de sites*.

Notei que muitos cursos ainda não aproveitam todo o potencial de dois pontos importantes:
– Um *site completo*, moderno e funcional, que transmita profissionalismo e facilite o contato com alunos.
– E *materiais digitais personalizados*, como *apostilas em PDF*, *apresentações*, *exercícios interativos* e outros recursos que valorizam a experiência do aluno.

Se você estiver pensando em melhorar algum desses pontos — ou os dois — posso te ajudar com soluções práticas e acessíveis.

Se fizer sentido pra você, *podemos conversar* melhor sobre como aplicar isso no seu curso.`
    }

    const defaultMessage = `Me chamo Giulia e sou especialista em *criação e reformulação de sites profissionais*. 

Vi que talvez você esteja pensando em *criar um site novo* ou *dar uma modernizada no atual* — e isso pode fazer *toda a diferença* na forma como seus clientes veem seu negócio.

Se quiser, podemos *conversar melhor* e ver como posso te ajudar com isso.`

    return messages[category] || defaultMessage
}

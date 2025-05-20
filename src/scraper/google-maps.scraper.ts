import { Injectable } from '@nestjs/common';
import { Lead } from '@prisma/client';

const bairrosSorocaba = [
    "Campolim",
    "Centro",
    "Vila Hortência",
    "Jardim Europa",
    "Além Ponte",
    "Jardim Santa Bárbara",
    "Wanel Ville",
    "Jardim Paulistano",
    "Vila Barão",
    "Jardim Ipiranga",
    "Jardim Astúrias",
    "Vila Santana",
    "Jardim São Paulo",
    "Parque Campolim",
    "Jardim Emília",
    "Vila Haro",
    "Jardim Santa Rosália",
    "Parque São Bento",
    "Vila Carvalho",
    "Jardim Marcelo Augusto",
    "Vila São João",
    "Jardim Refúgio",
    "Jardim Maria Eugênia",
    "Parque das Laranjeiras",
    "Jardim Santo André",
    "Vila Leão",
    "Jardim Abaeté",
    "Vila Progresso",
    "Jardim América",
    "Vila Sabiá"
];

@Injectable()
export class GoogleMapsScraper {
    private categories = [
        // 'Construtoras',
        // 'Escritórios de advocacia',
        'Clínicas médicas',
        'Clínicas odontológicas',
        'Consultórios',
        'Estéticas',
        'Consutorias',
        'Cursos de inglês',
    ];

    async scrapeSorocabaLeads(cb: (body: Lead[]) => Promise<void>) {
        const puppeteer = require('puppeteer-extra');
        const Stealth = require('puppeteer-extra-plugin-stealth')();
        puppeteer.use(Stealth);

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Configurações de viewport para melhor renderização
        await page.setViewport({ width: 1440, height: 900 });

        // Embaralha a ordem das categorias antes de processar
        const shuffledCategories = [...this.categories].sort(() => Math.random() - 0.5);
        const shuffledBairros = [...bairrosSorocaba].sort(() => Math.random() - 0.5);
        for (const category of shuffledCategories) {
            console.log(category)
            for (const bairro of shuffledBairros) {
                try {
                    console.log(bairro)
                    await page.goto(
                        `https://www.google.com/maps/search/${encodeURIComponent(category)}+${encodeURIComponent(bairro)}+Sorocaba+SP`,
                        { waitUntil: 'networkidle2' }
                    );

                    await page.waitForSelector('.m6QErb.DxyBCb.kA9KIf.dS8AEf', { timeout: 10000 });

                    await page.waitForSelector('.m6QErb.DxyBCb.kA9KIf.dS8AEf', { timeout: 15000 });
                    const scrollContainers = await page.$$('.m6QErb.DxyBCb.kA9KIf.dS8AEf');

                    if (scrollContainers.length < 2) {
                        console.warn('⚠️ Container de scroll não encontrado. Pulando categoria...');
                        continue;
                    }

                    const scrollTarget = scrollContainers[1];

                    let isAtBottom = false;
                    let attempts = 0;
                    const maxScrolls = 1000;

                    while (!isAtBottom && attempts < maxScrolls) {
                        // scrolla suavemente com scrollBy
                        await page.evaluate((el) => {
                            el.scrollBy(0, 200);
                        }, scrollTarget);

                        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

                        // Verifica se apareceu o texto de "fim da lista"
                        isAtBottom = await page.evaluate(() => {
                            return !!document.querySelector('span.HlvSq');
                        });

                        attempts++;
                    }

                    // Extrair dados após scroll completo
                    const categoryResults = await page.evaluate(() => {
                        const results = [];
                        const items = document.querySelectorAll('.Nv2PK');

                        items.forEach((el) => {
                            const websiteElement = el.querySelector('.lcr4fd') as HTMLAnchorElement;
                            results.push({
                                name: el.querySelector('.qBF1Pd')?.textContent?.trim(),
                                phone: el.querySelector('.UsdlK')?.textContent?.trim(),
                                website: websiteElement?.href || '',
                                rating: parseFloat(el.querySelector('.MW4etd')?.textContent || '0'),
                                reviews: parseInt(
                                    el.querySelector('.UY7F9')?.textContent?.replace(/\D/g, '') || '0'
                                )
                            });
                        });

                        return results;
                    });

                    const body: Lead[] = categoryResults.map((item) => ({
                        name: item['name'],
                        phone: item['phone'],
                        website: item['website'],
                        rating: item['rating'],
                        reviews: item['reviews'],
                        category: category,
                    }))
                    console.log("Salvando", body.length)
                    await cb(body)
                    console.log("Salvo com sucesso", body.length)

                    // Delay anti-detecção
                    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
                } catch (error) {
                    console.error(`Error processing ${category} in ${bairro}:`, error);
                    continue;

                }
            }

        }

        await browser.close();
    }

}

import { ToolInputSchemaBase } from "@langchain/core/dist/tools/types";
import { Document } from "@langchain/core/documents";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { Logger } from "@nestjs/common";
import "dotenv/config";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import { config, embeddings } from "@infra/embeddings";
import { TipoCategoria, TipoTransacao } from "@prisma/client";

const logger = new Logger("StatementCreditCardRetrievalTool");
let vectorStore: PGVectorStore | null = null;

export const StatementCreditCardRetrievalTool = new DynamicStructuredTool({
    name: "statement_credit_card_retriever",
    description: "Consulta a base de dados de extratos de cartão de crédito para recuperar os documentos mais relevantes para a pergunta do usuário, filtrados por tenantId.",
    schema: z.object({
        query: z.string().describe("A pergunta do usuário ou o tópico sobre o qual buscar extratos."),
        tenantId: z.string().describe("O ID único do usuário (tenant) para filtrar os extratos."),
        categoria: z.enum(Object.values(TipoCategoria) as [string, ...string[]]).optional().describe("Categoria opcional para filtrar os extratos, se necessário."),
        type: z.enum(Object.values(TipoTransacao) as [string, ...string[]]).describe(`Tipo de transação a ser consultada, pode ser ${TipoTransacao.DESPESA} ou ${TipoTransacao.RECEITA}.`),
    }) as unknown as ToolInputSchemaBase,

    func: async ({ query, tenantId, type, categoria }: { query: string, tenantId: string, type: TipoTransacao, categoria?: TipoCategoria }): Promise<string> => {
        logger.debug(`Buscando extratos para tenantId: ${tenantId} com a query: ${query}`);
        if (!vectorStore) {
            logger.debug("Inicializando PGVectorStore...");
            vectorStore = await PGVectorStore.initialize(embeddings, config);
            logger.debug("PGVectorStore inicializado com sucesso.");
        }
        logger.debug("Iniciando busca de extratos no PGVectorStore...");
        try {
            const retriever = vectorStore.asRetriever({
                filter: { tenantId: tenantId, type, categoria, mode: 'TransacoesCartaoCredito' },
                verbose: true,
                k: 100
            });

            const results: Document[] = await retriever.invoke(query);

            const pageContents = results.map(doc => `${doc.pageContent} - Metadata: ${JSON.stringify(doc.metadata)}`);
            logger.debug(`Retornados ${pageContents.length} extratos.`);
            return pageContents.join("\n---\n");

        } catch (error) {
            logger.error(`Erro ao buscar extratos no PGVectorStore: ${error}`);
            if (error instanceof Error) {
                // Você pode querer retornar um erro ou uma lista vazia
                // Retornar o erro pode ser mais informativo para o chamador
                throw new Error(`Falha ao recuperar extratos: ${error.message}`);
            }
            throw new Error("Ocorreu um erro inesperado ao buscar os extratos.");
        }
    }
});


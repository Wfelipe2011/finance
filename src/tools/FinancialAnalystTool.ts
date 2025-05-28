import { ToolInputSchemaBase } from "@langchain/core/dist/tools/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
import { Logger } from "@nestjs/common";
import "dotenv/config";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

const model = new ChatDeepSeek({
    apiKey: process.env["DEEPSEEK_API_KEY"]!, // Certifique-se que DEEPSEEK_API_KEY está no seu .env
    model: 'deepseek-chat',
});

const logger = new Logger("FinancialAnalystTool");

export const FinancialAnalystTool = new DynamicStructuredTool({
    name: "financial_analyst",
    description: "Analisa uma lista de extratos bancários e de cartão de crédito para responder a perguntas específicas do usuário sobre suas finanças.",
    schema: z.object({
        statements: z.array(z.string()).describe("Uma lista contendo o texto dos extratos financeiros relevantes para a consulta."),
        query: z.string().describe("A pergunta específica do usuário sobre os extratos fornecidos.")
    }) as unknown as ToolInputSchemaBase,

    func: async ({ statements, query }: { statements: string[], query: string }): Promise<string> => {
        logger.debug(`Analisando ${statements.length} extratos para a pergunta: ${query}`);

        // Junta os extratos em um bloco de texto para o prompt
        const statementsText = statements; // Separador entre extratos

        const systemMessageTemplate = ChatPromptTemplate.fromTemplate(`Você é um assistente analista financeiro prestativo.
Sua tarefa é analisar os extratos bancários e de cartão de crédito fornecidos.
Baseie sua resposta *exclusivamente* nas informações presentes nos extratos fornecidos abaixo. Não faça suposições nem use conhecimento externo.
Se a informação necessária para responder à pergunta não estiver presente nos extratos, informe claramente que não é possível responder com base nos dados fornecidos.

Extratos Fornecidos:
---
{statementsText}
---

Pergunta do Usuário: {query}

Sua Resposta Precisa:`);

        const prompt = await systemMessageTemplate.formatPromptValue({
            statementsText,
            query
        });

        try {
            const response = await model.invoke(prompt.messages);
            const answer = response.content.toString();
            logger.debug(`Resposta gerada: ${answer}`);
            return answer;
        } catch (error) {
            logger.error(`Erro ao invocar o modelo LLM: ${error}`);
            // Retorna uma mensagem de erro genérica ou mais específica
            if (error instanceof Error) {
                return `Desculpe, ocorreu um erro ao processar sua solicitação: ${error.message}`;
            }
            return "Desculpe, ocorreu um erro inesperado ao tentar analisar seus extratos.";
        }
    }
});
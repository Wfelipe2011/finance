import { ToolInputSchemaBase } from "@langchain/core/dist/tools/types";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
import { Logger } from "@nestjs/common";
import "dotenv/config";
import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";

const model = new ChatDeepSeek({
    apiKey: process.env["DEEPSEEK_API_KEY"]!,
    model: 'deepseek-chat',
});
const logger = new Logger("TranslationTool");
export const TranslationTool = new DynamicStructuredTool({
    name: "translation",
    description: "Translates text from Portuguese to English",
    schema: z.object({
        text: z.string().describe("Texto em português para traduzir"),
        context: z.string().optional().describe("Contexto adicional para melhor tradução")
    }) as unknown as ToolInputSchemaBase,

    func: async ({ text, context }: { text: string, context: string }): Promise<string> => {
        logger.debug(`Traduzindo texto: ${text}`);
        const systemMessageTemplate = ChatPromptTemplate.fromTemplate(`You are a translator from Portuguese to English.
Translate the user's message into English, preserving meaning, and respond with **only** the translated text.
Do not include any commentary, analysis, or extra information.

Context: {context}

Text to translate:
{text}
        `);

        const prompt = await systemMessageTemplate.formatPromptValue({
            text,
            context
        });

        const response = await model.invoke(prompt.messages);
        logger.debug(`Texto traduzido: ${response.content}`);
        return response.content.toString();
    }
})
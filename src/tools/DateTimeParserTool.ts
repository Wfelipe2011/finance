import { ToolInputSchemaBase } from '@langchain/core/dist/tools/types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import * as chrono from 'chrono-node';
import dayjs from 'dayjs';
import { z } from "zod";

/**
 * Ferramenta simplificada de análise de data/hora usando chrono-node.
 * - Analisa texto em inglês para datas e horários.
 * - Retorna uma string no formato ISO8601 com sufixo 'Z' (UTC) ou null.
 * 
 * @returns { date: string | null } - Objeto com a data analisada ou null se não houver data.
 * @example
 * const date = await DateTimeParserTool.invoke({ text: 'March 3, 2025 at 5pm' });
 * const parsedDate = JSON.parse(date) as { date: string | null };
 * const dateISO = parsedDate.date; // "2025-03-03T20:00:00.000Z"
 */
export const DateTimeParserTool = new DynamicStructuredTool({
  name: "datetime_parser",
  description: "Extracts dates from English text with time period handling. Returns ISO8601 string or null",
  schema: z.object({
    text: z.string().describe("English text containing a time reference"),
  }) as unknown as ToolInputSchemaBase,
  func: async ({ text }: { text: string }): Promise<string> => {

    const refDate = dayjs().toDate();
    const results = chrono.casual.clone().parse(text, refDate, { forwardDate: true });
    if (!results.length || !results[0] || !results[0].start) {
      return JSON.stringify({ date: null });
    }

    const start = results[0].start;
    const date = dayjs(start.date()).toDate();
    return JSON.stringify({ date: date.toISOString() });
  }
})

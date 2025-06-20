import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { z } from "zod";

const transacaoSchema = z.object({
  data: z.string().nullable(),
  descricao: z.string().nullable(),
  credito: z.number().nullable(),
  debito: z.number().nullable(),
  saldo: z.number().nullable(),
  categoria: z.string().nullable(),
});

const responseSchema = z.object({
  transacoes: z.array(transacaoSchema),
});

@Injectable()
export class TransactionsUploadService {
  constructor(readonly httpService: HttpService) { }
 
  async uploadFile(file: Express.Multer.File) {
    const fileContent = file.buffer.toString('base64');
    const promptPayload = this.generatePrompt(fileContent);
    return this.callGeminiAPI(promptPayload);
  }

  private async callGeminiAPI(body: any) {
    try {
      const response = await this.httpService.axiosRef.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            key: process.env['GOOGLE_API_KEY'], // Ensure you have set this environment variable
          },
        }
      )
      const { candidates } = response.data;
      const data = candidates[0].content.parts[0].text;
      const parsedData = responseSchema.parse(JSON.parse(data));
      return parsedData;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to call Gemini API');
    }
  }

  private generatePrompt(fileContent: string) {
    return {
      "contents": [
        {
          "parts": [
            {
              "inline_data": {
                "mime_type": "application/pdf",
                "data": fileContent
              }
            },
            {
              "text": `You are a data extraction agent who is helping to extract information from a Bradesco current account statement and you are an expert in categorizing credit card purchases. The options are:ALIMENTACAO,SAUDE,TRANSPORTE,LAZER,EDUCACAO,SERVICOS,OUTROS,DONATIVOS,PETS`
            }
          ]
        }
      ],
      "generationConfig": {
        "response_mime_type": "application/json",
        "response_schema": {
          "type": "OBJECT",
          "required": [
            "transacoes"
          ],
          "properties": {
            "transacoes": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "data",
                  "descricao",
                  "credito",
                  "debito",
                  "saldo",
                  "categoria"
                ],
                "properties": {
                  "data": {
                    "type": "string",
                    "nullable": true
                  },
                  "descricao": {
                    "type": "string",
                    "nullable": true
                  },
                  "credito": {
                    "type": "number",
                    "nullable": true
                  },
                  "debito": {
                    "type": "number",
                    "nullable": true
                  },
                  "saldo": {
                    "type": "number",
                    "nullable": true
                  },
                  "categoria": {
                    "type": "string",
                    "nullable": true
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

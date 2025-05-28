import { DateTimeParserTool } from "./DateTimeParserTool";

describe('DateTimeParserTool', () => {
  const tool = DateTimeParserTool;

  test('retorna null para texto sem datas', async () => {
    const response = await tool.invoke({ text: 'no date here' }); // Texto sem data
    const parsedResponse = JSON.parse(response) as { date: string | null };
    expect(parsedResponse.date).toBeNull();
  });

  test('analisa uma data simples', async () => {
    const response = await tool.invoke({ text: 'March 3, 2025 at 5pm' }); // Março 3, 2025 às 17h
    const parsedResponse = JSON.parse(response) as { date: string | null };
    expect(parsedResponse.date).toMatch("2025-03-03T20:00:00.000Z"); // Ajustado para o fuso horário America/Sao_Paulo
  });

  test('analisa uma data relativa no futuro', async () => {
    const response = await tool.invoke({ text: 'next friday morning' }); // Próxima sexta-feira de manhã
    const parsedResponse = JSON.parse(response) as { date: string | null };
    expect(parsedResponse.date).toMatch("2025-05-23T09:00:00.000Z");
  });

  test('analisa datas específicas com horário', async () => {
    const response = await tool.invoke({ text: 'December 25, 2025 at 8:30am' }); // 25 de dezembro de 2025 às 8h30
    const parsedResponse = JSON.parse(response) as { date: string | null };
    expect(parsedResponse.date).toMatch("2025-12-25T11:30:00.000Z");
  });

  test('analisa datas ambíguas e resolve para o futuro', async () => {
    const response = await tool.invoke({ text: 'March 1st' }); // 1º de março
    const parsedResponse = JSON.parse(response) as { date: string | null };
    const now = new Date();
    const parsedDate = new Date(parsedResponse.date as string);
    expect(parsedDate.getFullYear()).toBeGreaterThanOrEqual(now.getFullYear());
  });

  test('retorna null para texto de data inválido', async () => {
    const response = await tool.invoke({ text: 'random gibberish text' }); // Texto sem data
    const parsedResponse = JSON.parse(response) as { date: string | null };
    expect(parsedResponse.date).toBeNull();
  });

  test('analisa datas com fusos horários explícitos', async () => {
    const response = await tool.invoke({ text: 'June 15, 2024 at 3pm UTC' });
    const parsedResponse = JSON.parse(response) as { date: string | null };
    expect(parsedResponse.date).toMatch("2024-06-15T15:00:00.000Z"); // Ajustado para o fuso horário America/Sao_Paulo
  });

  test('analisa datas com frases relativas como "em dois dias"', async () => {
    const response = await tool.invoke({ text: 'in two days at noon' }); // Em dois dias ao meio-dia
    const parsedResponse = JSON.parse(response) as { date: string | null };
    const now = new Date();
    const parsedDate = new Date(parsedResponse.date as string);
    const diffInDays = Math.round((parsedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffInDays).toBe(2);
  });

  test('analisa datas com formatos mistos', async () => {
    const response = await tool.invoke({ text: '5pm on 07/04/2025' }); // 17h em 07/04/2025
    const parsedResponse = JSON.parse(response) as { date: string | null };
    expect(parsedResponse.date).toMatch("2025-07-04T20:00:00.000Z");
  });
});

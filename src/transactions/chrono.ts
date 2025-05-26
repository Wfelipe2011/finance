import * as chrono from 'chrono-node';
import dayjs from 'dayjs';

export async function chronoParse(dateString: string, refDate: Date = dayjs().toDate()): Promise<Date | null> {
    const results = chrono.parse(dateString, refDate, { forwardDate: true });
    console.debug(`Resultados do parseamento: ${JSON.stringify(results)}`);
    if (results.length > 0) {
        const result = results[0];
        return result.start.date();
    }
    return null;
}

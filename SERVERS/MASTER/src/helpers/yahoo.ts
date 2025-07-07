import yahooFinance from 'yahoo-finance2';

type PriceData = {
    date: string;
    close: number;
};

//this homie here returns the historical prices for a given stock ticker

export async function fetchHistoricalPrices(ticker: string, start: Date, from: Date): Promise<PriceData[]> {
    try {
        const result = await yahooFinance.historical(ticker, { period1: '1mo', interval: '1d' });
        return result.map((data: any) => ({
            date: data.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
            close: data.close

        }));
    } catch (err) {
        console.error('Failed to fetch prices:', err);
        throw err;
    }
}

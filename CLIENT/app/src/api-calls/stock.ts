import axios from 'axios';

export const fetchStockData = async (ticker: any, quantity: any, startDate: any, endDate: any) => {
    try {
        const response = await axios.post('http://localhost:3000/stock-api', {
            stockSymbol: ticker,
            quantity: parseInt(quantity),
            startDate: '2024-01-01',
            endDate: '2024-07-01',
            buyPrice: 150
        });

        return response.data;
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
    }
};

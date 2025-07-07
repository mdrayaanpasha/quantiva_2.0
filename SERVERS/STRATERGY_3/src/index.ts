import 'dotenv/config';
import express from 'express';
import amqp, { Channel } from 'amqplib';

const app = express();
app.use(express.json());
const PORT = 3005;

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing in .env file!');
    process.exit(1);
}
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let channel: Channel;

const connectQueue = async (): Promise<any> => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        console.log('✅ Connected to RabbitMQ');

        console.log(`🔑 GEMINI API Key: ${GEMINI_API_KEY ? 'Loaded' : 'Undefined - Check .env file!'}`);
        return { connection, channel };
    } catch (err) {
        console.error('❌ Failed to connect to RabbitMQ', err);
        process.exit(1);
    }
};

const calculateMean = (prices: number[]): number => {
    if (prices.length === 0) return NaN;
    const sum = prices.reduce((acc, price) => acc + price, 0);
    return sum / prices.length;
};

const shouldBuy = (prices: number[], thresholdPercent: number = 2): { decision: 'BUY' | 'NO_BUY', reason: string } => {
    const meanPrice = calculateMean(prices);
    const currentPrice = prices[prices.length - 1];

    const deviation = ((meanPrice - currentPrice) / meanPrice) * 100;

    if (deviation >= thresholdPercent) {
        return {
            decision: 'BUY',
            reason: `Current price (${currentPrice.toFixed(2)}) is ${deviation.toFixed(2)}% below mean (${meanPrice.toFixed(2)}). Potential mean reversion opportunity.`
        };
    } else {
        return {
            decision: 'NO_BUY',
            reason: `Current price (${currentPrice.toFixed(2)}) is within ${deviation.toFixed(2)}% of mean (${meanPrice.toFixed(2)}). No clear reversal opportunity.`
        };
    }
};

const Starter = async () => {
    const { channel: queueChannel } = await connectQueue();
    channel = queueChannel;

    await channel.assertQueue('mean_reversion_queue', { durable: true });
    await channel.assertQueue('master_response_aggregator_queue', { durable: true });

    console.log('🚀 MEAN REVERSION STRATEGY SERVER is waiting for messages...');

    channel.consume('mean_reversion_queue', async (msg) => {
        if (!msg) return;

        try {
            const parsedMsg = JSON.parse(msg.content.toString());

            if (parsedMsg.Task !== 'STRATEGY') {
                console.log(`❌ Invalid Task: ${parsedMsg.Task}. Expected 'STRATEGY'.`);
                channel.ack(msg);
                return;
            }

            const {
                correlationId,
                stockSymbol,
                quantity,
                buyPrice,
                boughtDayPrice,
                predictedProfit,
                actualProfit,
                errorPercentage,
                BoughtDayDate,
                PredictedDayDate,
                yahoo_data
            } = parsedMsg;

            console.log(`📥 MEAN REVERSION STRATEGY request received for ${stockSymbol}`);

            if (!yahoo_data || yahoo_data.length === 0) {
                console.error('❌ Yahoo data is missing.');
                channel.ack(msg);
                return;
            }

            const prices = yahoo_data.map((item: any) => item.close);

            const { decision, reason } = shouldBuy(prices);

            const response = {
                correlationId,
                strategy: 'MEAN_REVERSION',
                stockSymbol,
                decision,
                confidence: 'Price deviation from mean',
                reason // 
            };

            // Send response to response_queue
            channel.sendToQueue('master_response_aggregator_queue', Buffer.from(JSON.stringify(response)), { persistent: true });
            console.log(`✅ Sent decision: ${decision} for ${stockSymbol} | Reason: ${reason}`);

        } catch (err: any) {
            console.error('❌ Error processing message:', err);
            channel.nack(msg, false, false);
        } finally {
            channel.ack(msg);
        }
    }, { noAck: false });
};

Starter().catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`🔥 Mean Reversion Server running at http://localhost:${PORT}`);
});

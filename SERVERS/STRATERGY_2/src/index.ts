import 'dotenv/config';
import express from 'express';
import amqp, { Channel, Connection } from 'amqplib';
import axios from 'axios';

const app = express();
app.use(express.json());
const PORT = 3004;

if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is missing in .env file!');
    process.exit(1);
}
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let channel: Channel;

const connectQueue = async (): Promise<{ connection: Connection; channel: Channel }> => {
    try {
        const connection: any = await amqp.connect('amqp://localhost');
        const ch = await connection.createChannel();
        console.log('✅ Connected to RabbitMQ');
        console.log(`🔑 GEMINI API Key: ${GEMINI_API_KEY ? 'Loaded' : 'Undefined - Check .env file!'}`);
        return { connection, channel: ch };
    } catch (err) {
        console.error('❌ Failed to connect to RabbitMQ', err);
        process.exit(1);
    }
};

const calculateMovingAverage = (prices: number[], windowSize: number): number[] => {
    const movingAverages: number[] = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < windowSize - 1) {
            movingAverages.push(NaN);
            continue;
        }
        const window = prices.slice(i - windowSize + 1, i + 1);
        const average = window.reduce((sum, price) => sum + price, 0) / window.length;
        movingAverages.push(average);
    }
    return movingAverages;
};

const shouldBuy = (prices: number[], shortWindow: number, longWindow: number): { decision: 'BUY' | 'NO_BUY'; reason: string } => {
    const shortMA = calculateMovingAverage(prices, shortWindow);
    const longMA = calculateMovingAverage(prices, longWindow);

    const lastIndex = prices.length - 1;

    if (lastIndex < longWindow) {
        return {
            decision: 'NO_BUY',
            reason: 'Not enough historical data to compute reliable long-term moving average.'
        };
    }

    const previousShortMA = shortMA[lastIndex - 1];
    const previousLongMA = longMA[lastIndex - 1];
    const currentShortMA = shortMA[lastIndex];
    const currentLongMA = longMA[lastIndex];

    if (previousShortMA < previousLongMA && currentShortMA > currentLongMA) {
        return {
            decision: 'BUY',
            reason: `Short-term average (${currentShortMA.toFixed(2)}) just crossed above long-term average (${currentLongMA.toFixed(2)}). Indicates potential uptrend.`
        };
    }

    return {
        decision: 'NO_BUY',
        reason: `Short-term average (${currentShortMA.toFixed(2)}) is below or not crossing long-term average (${currentLongMA.toFixed(2)}). No clear buy signal.`
    };
};

const RespondToPortfolio = async (companiesYahooData: any[], correlationId: string) => {

    if (!Array.isArray(companiesYahooData) || companiesYahooData.length === 0) {
        console.error('❌ Invalid or empty portfolio data.');
        return;
    }

    const results = companiesYahooData.map((company) => {
        const prices: number[] = company.yahooPrices;

        if (!prices || prices.length < 5) {
            return {
                stockSymbol: company.stockSymbol,
                decision: 'NO_BUY',
                reason: 'Insufficient data for moving average calculation.'
            };
        }

        const { decision, reason } = shouldBuy(prices, 3, 5);
        return { stockSymbol: company.stockSymbol, decision, reason };
    });

    const totalBuy = results.filter(r => r.decision === 'BUY').length;
    const total = results.length;

    const finalDecision = totalBuy >= Math.ceil(total / 2) ? 'BUY' : 'NO_BUY';
    const aggregatedReason = `BUY signals for ${totalBuy}/${total} stocks. Portfolio decision: ${finalDecision}.`;

    const response = {
        correlationId, // ✅ add this
        strategy: 'AVG_CROSSOVER_PORTFOLIO',
        decision: finalDecision,
        details: results,
        reason: aggregatedReason,
        confidence: 'Portfolio-based crossover analysis'
    };

    channel.sendToQueue('master_response_aggregator_queue', Buffer.from(JSON.stringify(response)), {
        persistent: true,
    });

    console.log(`✅ Portfolio strategy decision sent: ${finalDecision} | ${aggregatedReason}`);
};

const Starter = async () => {
    const { channel: queueChannel } = await connectQueue();
    channel = queueChannel;

    await channel.assertQueue('st2_queue', { durable: true });
    await channel.assertQueue('response_queue', { durable: true });
    await channel.assertQueue('master_response_aggregator_queue', { durable: true });
    console.log('🚀 AVG CROSSOVER STRATEGY SERVER is waiting for messages...');

    channel.consume('st2_queue', async (msg) => {
        if (!msg) return;

        try {
            const parsedMsg = JSON.parse(msg.content.toString());

            if (parsedMsg.Task === 'PORTFOLIO_STRATERGY') {
                console.log("📦 Received portfolio strategy request");
                const { companiesYahooData, correlationId } = parsedMsg;
                await RespondToPortfolio(companiesYahooData, correlationId);
            } else {
                const {
                    correlationId,
                    stockSymbol,
                    yahoo_data
                } = parsedMsg;

                console.log(`📥 AVG CROSSOVER STRATEGY request received for ${stockSymbol}`);

                if (!yahoo_data || yahoo_data.length === 0) {
                    console.error('❌ Yahoo data is missing.');
                    channel.ack(msg);
                    return;
                }

                const prices = yahoo_data.map((item: any) => item.close);
                const { decision, reason } = shouldBuy(prices, 3, 5);

                const response = {
                    correlationId,
                    strategy: 'AVG_CROSSOVER',
                    stockSymbol,
                    decision,
                    confidence: 'Price-based crossover',
                    reason
                };

                channel.sendToQueue('master_response_aggregator_queue', Buffer.from(JSON.stringify(response)), {
                    persistent: true
                });

                console.log(`✅ Sent decision: ${decision} for ${stockSymbol} | Reason: ${reason}`);
            }
        } catch (err) {
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
    console.log(`🔥 Server running at http://localhost:${PORT}`);
});

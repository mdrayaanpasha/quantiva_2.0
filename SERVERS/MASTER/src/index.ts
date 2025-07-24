import express, { Request, Response } from 'express';
import { connectQueue } from './queue';
import { v4 as uuidv4 } from 'uuid';
import yahooFinance from 'yahoo-finance2';
import cors from "cors";
import { createClient } from 'redis';
import UserRouter from './rotuers/user.router';
import PortfolioRouter from './rotuers/portfolio.router';
import dotenv from "dotenv";
dotenv.config()

// = = = = = REDIS CLIENT SETUP 🧠 = = = = =
const redisClient = createClient({
    url: process.env.REDIS_URL || ""
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// = = = = = EXPRESS APP SETUP 🚀 = = = = =
const app = express();
app.use(express.json());
app.use(cors())
const PORT = 3000;

let channel: any; // RabbitMQ channel

// = = = = = STARTER FUNCTION 🏁 = = = = =
const Starter = async () => {
    const queueConnection = await connectQueue();
    channel = queueConnection.channel;
    await redisClient.connect().catch(console.error); // Connect Redis
    app.listen(PORT, () => {
        console.log(`⚡ Server running at http://localhost:${PORT}`);
    });
};

// = = = = = ROUTING 🛤️ = = = = = = = = = = 
app.use("/api/userAuth", UserRouter);
app.use("/api/portfolio", PortfolioRouter);


// = = = = = SIMPLE SENDER ENDPOINT ✉️ = = = = =
app.post('/send', async (req: Request, res: Response): Promise<any> => {
    const { message } = req.body;
    if (!message) return res.status(400).send('Message is required');

    const queue = 'task_queue';
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

    console.log(`📤 Sent: ${message}`);
    return res.send('Message sent to queue');
});

// = = = = = STOCK API ENDPOINT 📈 = = = = =
app.post("/stock-api", async (req: Request, res: Response): Promise<any> => {
    try {
        const { stockSymbol, quantity, startDate, endDate, buyPrice } = req.body;

        if (!stockSymbol || !quantity || !startDate || !endDate) {
            return res.status(400).send('All fields are required');
        }

        // 🔑 Normalise and build cache key
        const cacheKey = `prediction:${stockSymbol.toUpperCase()}-${quantity}-${startDate}-${endDate}-${buyPrice}`;

        // 📦 Check if response is cached
        const redisData = await redisClient.get(cacheKey);
        if (redisData) {
            console.log(`⚡ Cache hit for ${cacheKey}`);
            return res.status(200).json(JSON.parse(redisData));
        }

        const correlationId = uuidv4();
        const requestQueue = 'task_queue';
        const masterQueue = 'master_response_aggregator_queue';

        // 📊 Fetch historical data from Yahoo Finance
        const DATA_FROM_YAHOO = await yahooFinance.historical(stockSymbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });

        await channel.assertQueue(requestQueue, { durable: true });
        await channel.assertQueue(masterQueue, { durable: true });

        const message = JSON.stringify({
            stockSymbol,
            quantity,
            startDate,
            endDate,
            buyPrice,
            correlationId,
            yahoo_data: DATA_FROM_YAHOO,
            Task: 'REGRESSION'
        });

        channel.sendToQueue(requestQueue, Buffer.from(message), { persistent: true });
        console.log(`📤 Sent task for ${stockSymbol} with correlationId: ${correlationId}`);

        // = = = = = WAIT FOR RESPONSES ⏳ = = = = =
        const waitForResponses = (): Promise<any> => {
            return new Promise((resolve, reject) => {
                const responses: any[] = [];
                const expectedResponses = 4; // Expecting 4 responses from workers

                let consumerTag: any; // Declare consumerTag here for scope

                const consumePromise = channel.consume(masterQueue, (msg: any) => {
                    if (!msg) return;

                    const response = JSON.parse(msg.content.toString());

                    if (response.correlationId === correlationId) {
                        responses.push(response);
                        console.log(`📥 Received response for ${response.stockSymbol}:`, response);
                        channel.ack(msg); // Acknowledge the message

                        if (responses.length === expectedResponses) {
                            // Cancel the consumer once all expected responses are received
                            channel.cancel(consumerTag.consumerTag)
                                .then(() => resolve({ responses, finalDecision: determineFinalDecision(responses) }))
                                .catch(reject); // Resolve the promise
                        }
                    } else {
                        // Nack message if it's not for this correlationId, requeue it
                        channel.nack(msg, false, true);
                    }
                }, { noAck: false })
                    .then((tag: any) => {
                        consumerTag = tag; // Store the consumer tag
                    })
                    .catch(reject); // Catch errors during consumer setup

                // Helper to determine the final decision
                const determineFinalDecision = (resps: any[]) => {
                    const strategyResponses = resps.filter(r => r.strategy !== 'REGRESSION');
                    const buyVotes = strategyResponses.filter(r => r.decision === 'BUY').length;
                    const noBuyVotes = strategyResponses.filter(r => r.decision === 'NO_BUY').length;
                    return buyVotes > noBuyVotes ? 'BUY_OVERALL' : 'NO_BUY_OVERALL';
                };
            });
        };

        const { responses, finalDecision } = await waitForResponses();

        const result = { finalDecision, responses };

        // 💾 Cache the result as string with 3 days expiry (259200 seconds)
        await redisClient.set(cacheKey, JSON.stringify(result), { EX: 259200 }); // Set expiry with EX
        console.log(`🧠 Cached prediction under ${cacheKey}`);

        return res.status(200).json(result);

    } catch (err) {
        console.error('❌ Error in /stock-api:', err);
        // Ensure that if an error occurs before awaiting responses, the client doesn't hang
        return res.status(500).send('Internal Server Error');
    }
});

// = = = = = SERVER BOOTSTRAP ⚡ = = = = =
Starter().catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
});
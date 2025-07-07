import express, { Request, Response } from 'express';
import { connectQueue } from './queue';
import { v4 as uuidv4 } from 'uuid';
import yahooFinance from 'yahoo-finance2';
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors())
const PORT = 3000;

let channel: any;

const Starter = async () => {
    const queueConnection = await connectQueue();
    channel = queueConnection.channel;

    app.listen(PORT, () => {
        console.log(`⚡ Server running at http://localhost:${PORT}`);
    });
};

// Simple sender endpoint
app.post('/send', async (req: Request, res: Response): Promise<any> => {
    const { message } = req.body;
    if (!message) return res.status(400).send('Message is required');

    const queue = 'task_queue';
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });

    console.log(`📤 Sent: ${message}`);
    return res.send('Message sent to queue');
});

// Main stock prediction endpoint
app.post("/stock-api", async (req: Request, res: Response): Promise<any> => {
    try {
        const { stockSymbol, quantity, startDate, endDate, buyPrice } = req.body;

        if (!stockSymbol || !quantity || !startDate || !endDate) {
            return res.status(400).send('All fields are required');
        }

        const correlationId = uuidv4();
        const requestQueue = 'task_queue';
        const masterQueue = 'master_response_aggregator_queue';

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

        // Set up the waiting promise
        const waitForResponses = (): Promise<any> => {
            return new Promise((resolve, reject) => {
                const responses: any[] = [];
                const expectedResponses = 4;

                const consumer = channel.consume(masterQueue, (msg: any) => {
                    if (!msg) return;

                    const response = JSON.parse(msg.content.toString());

                    if (response.correlationId === correlationId) {
                        responses.push(response);
                        console.log(`📥 Received response for ${response.stockSymbol}:`, response);
                        channel.ack(msg);

                        if (responses.length === expectedResponses) {
                            channel.cancel(consumerTag.consumerTag);

                            // Exclude regression model
                            const strategyResponses = responses.filter(r => r.strategy !== 'REGRESSION');

                            const buyVotes = strategyResponses.filter(r => r.decision === 'BUY').length;
                            const noBuyVotes = strategyResponses.filter(r => r.decision === 'NO_BUY').length;

                            const finalDecision = buyVotes > noBuyVotes ? 'BUY_OVERALL' : 'NO_BUY_OVERALL';

                            resolve({ responses, finalDecision });
                        }
                    } else {
                        // Not our message, leave it in the queue
                        channel.nack(msg, false, true);
                    }
                }, { noAck: false }).then((tag: any) => {
                    consumerTag = tag;
                }).catch(reject);

                let consumerTag: any;
            });
        };


        const { responses, finalDecision } = await waitForResponses();

        return res.status(200).send({
            finalDecision,
            responses
        });

    } catch (err) {
        console.error('❌ Error in /stock-api:', err);
        return res.status(500).send('Internal Server Error');
    }
});


Starter().catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
});

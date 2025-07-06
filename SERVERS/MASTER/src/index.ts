import express, { Request, Response } from 'express';
import { connectQueue } from './queue';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
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
    const { stockSymbol, quantity, startDate, endDate, buyPrice } = req.body;

    if (!stockSymbol || !quantity || !startDate || !endDate) {
        return res.status(400).send('All fields are required');
    }

    const correlationId = uuidv4();
    const requestQueue = 'task_queue';
    const responseQueue = 'response_queue';

    await channel.assertQueue(requestQueue, { durable: true });
    await channel.assertQueue(responseQueue, { durable: true });

    const message = JSON.stringify({
        stockSymbol,
        quantity,
        startDate,
        endDate,
        buyPrice,
        correlationId,
        Task: 'REGRESSION'
    });

    channel.sendToQueue(requestQueue, Buffer.from(message), { persistent: true });
    console.log(`📤 Sent task for ${stockSymbol} with correlationId: ${correlationId}`);

    return res.status(202).send({
        message: 'Task sent to queue',
        correlationId
    });

});

Starter().catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
});

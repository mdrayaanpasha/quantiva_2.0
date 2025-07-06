import 'dotenv/config'; // Add this line at the very top
import express from 'express';
import amqp from 'amqplib';
import axios from 'axios';

const app = express();
app.use(express.json());
const PORT = 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const connectQueue = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        console.log('✅ Connected to RabbitMQ');
        // Log the API key here to confirm it's loaded
        console.log(`gemini api key: ${GEMINI_API_KEY ? 'Loaded' : 'Undefined - Check .env file!'}`);
        return { connection, channel };
    } catch (err) {
        console.error('❌ Failed to connect to RabbitMQ', err);
        process.exit(1);
    }
};

let channel: any;

const Starter = async () => {
    const queueConnection = await connectQueue();
    channel = queueConnection.channel;

    await channel.assertQueue('task_queue', { durable: true });
    await channel.assertQueue('response_queue', { durable: true });

    console.log('📊 Strategy Server is waiting for messages...');

    channel.consume('task_queue', async (msg: any) => {
        if (!msg) return;

        const parsedMsg = JSON.parse(msg.content.toString());

        if (parsedMsg.Task !== 'STRATEGY') {
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
            BoughtDayDate, // New parameter
            PredictedDayDate, // New parameter
        } = parsedMsg;

        console.log(`📥 Strategy request received for ${stockSymbol}`);

        try {
            // Check if GEMINI_API_KEY is available before making the request
            if (!GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY is not defined. Please set it in your .env file.');
            }

            const prompt = `
You are a stock trading assistant specializing in momentum strategies.
I have the following stock details:
- Stock: ${stockSymbol}
- Quantity: ${quantity}
- Buy Price: ${buyPrice}
- Bought Day Price: ${boughtDayPrice}
- Predicted Profit: ${predictedProfit}
- Actual Profit: ${actualProfit}
- Error Percentage: ${errorPercentage}

Consider the period from ${BoughtDayDate || 'an unspecified start date'} to ${PredictedDayDate || 'an unspecified end date'}.
Based on a momentum strategy, and considering the following factors during that date range:
- Geopolitical events
- Sentiment on Reddit
- Sentiment on X (formerly Twitter)

Should I buy more of this stock? Answer "YES" or "NO" only, no explanation.
`;
            // ✅ Axios call to Gemini API
            const geminiResponse = await axios.post(
                "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent", {
                contents: [{
                    parts: [{
                        text: prompt,
                    }]
                }],
                // ✨ Added generationConfig to fine-tune the response
                generationConfig: {
                    temperature: 0, // Make the model more deterministic
                    maxOutputTokens: 5, // Optional: Can limit output length, but might cut off words
                },
            },
                {
                    headers: { "Content-Type": "application/json" },
                    params: { key: GEMINI_API_KEY },
                }
            );

            const responseText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text?.trim().toUpperCase() || '';
            console.log(`📈 Gemini response for ${stockSymbol}: ${responseText}`);
            const decision = responseText.includes('YES') ? 'BUY' : 'NO_BUY';

            // Calculate profit or loss based on the decision
            let profitOrLoss = actualProfit;

            const response = {
                correlationId,
                strategy: 'GEMINI_AI',
                stockSymbol,
                decision,
                confidence: 'Based on Gemini response',
                profitOrLoss: profitOrLoss, // Added profitOrLoss to the response
            };

            channel.sendToQueue('response_queue', Buffer.from(JSON.stringify(response)), { persistent: true });
            console.log(`✅ Sent decision: ${decision} for ${stockSymbol}, Profit/Loss: ${profitOrLoss}`);
        } catch (err: any) {
            console.error('❌ Gemini API error:', err.message);
            // Log the full error response from Axios if available
            if (err.response) {
                console.error('Gemini API Response Data:', err.response.data);
                console.error('Gemini API Response Status:', err.response.status);
                console.error('Gemini API Response Headers:', err.response.headers);
            }
            const errorResponse = {
                correlationId,
                strategy: 'GEMINI_AI',
                stockSymbol,
                decision: 'ERROR',
                error: err.response ? err.response.data : err.message || 'Unknown error'
            };
            channel.sendToQueue('response_queue', Buffer.from(JSON.stringify(errorResponse)), { persistent: true });
        } finally {
            channel.ack(msg);
        }
    }, {
        noAck: false // Ensure messages are acknowledged
    });
};

Starter().catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
});

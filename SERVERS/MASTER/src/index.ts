import express, { Request, Response } from 'express';
import { connectQueue } from './queue';
import { v4 as uuidv4 } from 'uuid';
import yahooFinance from 'yahoo-finance2';
import axios from "axios";
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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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


app.post("/portfolio-chat", async (req: Request, res: Response): Promise<any> => {
    try {
        const { message, question } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).send("Message is required and must be a string");
        }

        // Construct the prompt cleanly
        const reasoningPrompt = `
You are a professional financial analyst.

Using the portfolio summary below, answer the user's question with a concise, evidence-based explanation (maximum 200 words). 
Your response must:
- Directly address the user's question.
- Reference relevant data points or trends from the portfolio summary and real world at the moment.
- Maintain an objective and analytical tone.
- Avoid redundancy.
- use at most 3 emojis in a repsonse, while maintaining a professional tone.

Portfolio Summary:
${message}

User Question:
${question}
`.trim();


        const reasonRes = await axios.post(
            "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: reasoningPrompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 300
                }
            },
            {
                headers: {
                    "Content-Type": "application/json"
                },
                params: {
                    key: GEMINI_API_KEY
                }
            }
        );

        const finalText = reasonRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No reasoning provided.";
        console.log(`🧠 Gemini Reasoning:\n${finalText}`);
        return res.status(200).json({ text: finalText });

    } catch (error: any) {
        console.error("❌ Error in /portfolio-chat:", error?.response?.data || error.message);
        return res.status(500).send("Internal Server Error");
    }
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
                        console.log(response.length)
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


app.post("/multiple-portfolio-regression", async (req: Request, res: Response): Promise<any> => {

    // getting the company info array from client.
    let { companiesInfoArray } = req.body;



    // creating q req body.
    const correlationId = uuidv4();
    const correlationPromises = companiesInfoArray.map(async (company: any) => {
        const yahooData = await yahooFinance.historical(company.stockSymbol, {
            period1: company.startDate,
            period2: company.endDate,
            interval: '1d'
        });

        return {
            ...company,
            yahoo_data: yahooData
        };
    });

    const results = await Promise.all(correlationPromises);


    // q message body

    const Q_REQ_BODY = {
        companyInfoArray: results, // ← make the key match the consumer
        correlationId,
        Task: "REGRESSION_ONLY"
    };


    const requestQueue = 'task_queue';
    const masterQueue = 'master_response_aggregator_queue';

    await channel.assertQueue(requestQueue, { durable: true });
    await channel.assertQueue(masterQueue, { durable: true });

    console.log(`📤 Sending task with correlationId: ${correlationId}`);


    // Send message to regression server
    channel.sendToQueue(
        requestQueue,
        Buffer.from(JSON.stringify(Q_REQ_BODY)),
        { persistent: true }
    );

    console.log(`📤 Sent task with correlationId: ${correlationId}`);

    // Listen for response
    const resultPromise = new Promise<any>((resolve, reject) => {
        let consumerTag: any;

        const onMessage = (msg: any) => {
            if (!msg) return;
            const response = JSON.parse(msg.content.toString());

            if (
                response.correlationId === correlationId &&
                response.Task === 'REGRESSION_ONLY_RESPONSE'
            ) {
                channel.ack(msg);
                channel.cancel(consumerTag.consumerTag) // ❗ cancel the listener
                    .then(() => resolve(response))
                    .catch(reject);
            } else {
                channel.nack(msg, false, true); // Requeue unmatched messages
            }
        };

        channel.consume(masterQueue, onMessage, { noAck: false })
            .then((tag: any) => {
                consumerTag = tag;
            })
            .catch(reject);
    });


    const result = await resultPromise;
    return res.status(200).json(result); // ✅ Fix: send resolved data back to client




});



app.post('/gemini/portfolio-strategy', async (req, res) => {
    const { companies } = req.body;
    const correlationId = uuidv4();
    let responded = false;

    const msg = {
        companies,
        Task: 'PORTFOLIO_STRATERGY', // fix spelling
        correlationId
    };

    await channel.assertQueue('task_queue', { durable: true });
    await channel.assertQueue('master_response_aggregator_queue', { durable: true });

    // Send task
    channel.sendToQueue('task_queue', Buffer.from(JSON.stringify(msg)), {
        persistent: true,
        correlationId
    });

    console.log(`📤 Sent task with correlationId: ${correlationId}`);

    // Timeout to prevent hanging forever
    const timeout = setTimeout(() => {
        if (!responded) {
            responded = true;
            res.status(504).json({ error: 'Gemini strategy engine timeout.' });
        }
    }, 10000); // 10 sec timeout

    // Listen for the correct response
    // Inside the POST handler for /gemini/portfolio-strategy
    const consumerTag = await channel.consume('master_response_aggregator_queue', (msg: any) => {
        if (!msg) return;

        const result = JSON.parse(msg.content.toString());
        console.log("📨 Got message in portfolio-strategy consumer:");
        console.log("Parsed result:", result);
        console.log("Expected correlationId:", correlationId);
        console.log("Received correlationId:", msg.properties.correlationId);


        if (
            result.Type === 'PORTFOLIO_GEO_POLITICS' &&
            msg.properties.correlationId === correlationId
        ) {
            responded = true;
            clearTimeout(timeout);
            res.json(result);

            // ✅ Clean shutdown
            channel.ack(msg);
            channel.cancel(consumerTag.consumerTag);
        } else {
            // 🔁 Not for us — requeue it
            channel.nack(msg, false, true);
        }
    }, { noAck: false });

});

import amqp from 'amqplib';

app.post('/st2/portfolio-strategy', async (req: Request, res: Response): Promise<any> => {


    const { companiesData } = req.body;
    /*
    here companiesData looks like this: [
    {
    stockSymbol": "AAPL",
      "startDate": "2023-01-01",
      "endDate": "2023-12-31",
    }
      ...
      ]

      first step fetch yahoo data for all then second step is to send the yahoo data of them to the startegy 2 server via queue.
      - then st2 server computes the moving average of all companies and then it averages them.

    */


    if (!Array.isArray(companiesData) || companiesData.length === 0) {
        return res.status(400).json({ error: 'companiesData is required and must be a non-empty array.' });
    }

    const correlationId = uuidv4();
    let responded = false;
    // 🛠️ Step 1: Fetch Yahoo data for all companies
    const yahoo_data = await Promise.all(companiesData.map(async (company) => {
        const { stockSymbol, startDate, endDate } = company;
        try {
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}`, {
                params: {
                    period1: Math.floor(new Date(startDate).getTime() / 1000),
                    period2: Math.floor(new Date(endDate).getTime() / 1000),
                    interval: '1d'
                }
            });

            const data = response.data.chart.result?.[0];
            return {
                stockSymbol,
                correlationId,
                yahooPrices: data?.indicators?.quote?.[0]?.close || [],
                timestamps: data?.timestamp || [],
                startDate,
                endDate,

            };
        } catch (err) {
            console.error(`Error fetching data for ${stockSymbol}:`, err instanceof Error ? err.message : "error");
            return null; // Optional: skip or handle differently
        }
    }));




    const filteredYahooData = yahoo_data.filter(Boolean);

    const requestQueue = 'st2_queue';
    const responseQueue = 'master_response_aggregator_queue';

    await channel.assertQueue(requestQueue, { durable: true });
    await channel.assertQueue(responseQueue, { durable: true });

    const message = {
        companiesYahooData: filteredYahooData,
        Task: "PORTFOLIO_STRATERGY",
        correlationId
    }

    // Send to strategy server
    channel.sendToQueue(requestQueue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        correlationId
    });

    console.log(`📤 Sent portfolio strategy task with correlationId: ${correlationId}`);
    const timeout = setTimeout(() => {
        if (!responded) {
            responded = true;
            channel.cancel(consumerTag.consumerTag);
            return res.status(504).json({ error: 'Portfolio strategy response timed out.' });
        }
    }, 10000); // 10 seconds timeout

    const consumerTag = await channel.consume(responseQueue, (msg: amqp.ConsumeMessage | null) => {
        if (!msg || responded) return;

        const response = JSON.parse(msg.content.toString());
        const incomingCorrelationId = msg.properties.correlationId;

        console.log(`📥 Received message on ${responseQueue}`);
        console.log('🧾 Response:', response);
        console.log('🔁 Correlation ID (incoming):', incomingCorrelationId);

        if (
            response.strategy === 'AVG_CROSSOVER_PORTFOLIO' &&
            response.correlationId === correlationId
        ) {
            responded = true;
            clearTimeout(timeout);
            channel.ack(msg);
            channel.cancel(consumerTag.consumerTag).catch(console.error);
            return res.json(response);
        } else {
            channel.nack(msg, false, true); // Requeue if not matched
        }
    }, { noAck: false });


});

app.post('/strategy/mean-reversion', async (req: Request, res: Response): Promise<any> => {
    const { companiesData } = req.body;

    if (!Array.isArray(companiesData) || companiesData.length === 0) {
        return res.status(400).json({ error: 'companiesData is required and must be a non-empty array.' });
    }

    try {
        const correlationId = uuidv4();
        const meanReversionQueue = 'mean_reversion_queue';

        const replyQueue = await channel.assertQueue('', { exclusive: true });

        const yahoo_data = await Promise.all(
            companiesData.map(async (company: any) => {
                const { stockSymbol, startDate, endDate } = company;
                try {
                    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}`, {
                        params: {
                            period1: Math.floor(new Date(startDate).getTime() / 1000),
                            period2: Math.floor(new Date(endDate).getTime() / 1000),
                            interval: '1d'
                        }
                    });

                    const result = response.data.chart.result?.[0];
                    const prices = result?.indicators?.quote?.[0]?.close?.filter((p: number | null) => p !== null) || [];

                    return {
                        stockSymbol,
                        yahooPrices: prices,
                    };

                } catch (err: any) {
                    console.error(`❌ Error fetching data for ${stockSymbol}:`, err.message);
                    return null;
                }
            })
        );

        const companiesYahooData = yahoo_data.filter(Boolean);
        const message = {
            companiesYahooData,
            Task: 'PORTFOLIO_MR',
            correlationId
        }

        channel.sendToQueue(meanReversionQueue, Buffer.from(JSON.stringify(message)), {
            persistent: true,
            correlationId,
            replyTo: replyQueue.queue
        });

        // ✅ Wait for the response ONCE, then respond
        const timeout = setTimeout(() => {
            console.error("⏰ Timeout: No response from mean-reversion strategy.");
            return res.status(504).json({ error: 'Timeout waiting for strategy response' });
        }, 10000); // or however long you want to wait

        const { consumerTag } = await channel.consume(replyQueue.queue, (msg: any) => {
            if (!msg) return;

            const response = JSON.parse(msg.content.toString());

            if (
                response.strategy === 'MEAN_REVERSION' &&
                response.correlationId === correlationId
            ) {
                clearTimeout(timeout);
                channel.ack(msg);
                // channel.cancel(consumerTag).catch(console.error);
                return res.json(response); // ✅ Respond only once here
            } else {
                channel.nack(msg, false, true);
            }
        }, { noAck: false });

        // ❌ REMOVE THIS LINE
        // return res.status(200).json({ yahoo_data });

    } catch (err: any) {
        console.error('❌ Error in /strategy/mean-reversion handler:', err.message || err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});



// = = = = = SERVER BOOTSTRAP ⚡ = = = = =
Starter().catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
});
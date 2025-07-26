import 'dotenv/config';
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
        console.log(`🔑 GEMINI API Key: ${GEMINI_API_KEY ? 'Loaded' : 'Undefined - Check .env file!'}`);
        return { connection, channel };
    } catch (err) {
        console.error('❌ Failed to connect to RabbitMQ', err);
        process.exit(1);
    }
};

let channel: any;

const doStuff = async (msg: any) => {
    const { companies, correlationId } = msg;

    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not defined. Please set it in your .env file.');
    }

    const companyList = companies.map((c: any) => `${c.stockSymbol} from ${c.from} to present`).join(', ');

    const decisionPrompt = `
You are a stock trading assistant specializing in momentum strategies.

I am currently considering whether I should buy more shares in the following companies: [${companyList}]

For each company, consider:
- Geopolitical events
- Sentiment on Reddit
- Sentiment on X (formerly Twitter)

Rate the current buying potential for each stock as one of the following:
- "STRONG" (strong buy)
- "AVERAGE" (neutral or moderate confidence)
- "WEAK" (not advisable to buy now)

Format your response exactly like:
- SYMBOL_1: STRONG/AVERAGE/WEAK
- SYMBOL_2: STRONG/AVERAGE/WEAK
- ...

Do not include any explanations, summaries, or extra content.
`.trim();

    const decisionRes = await axios.post(
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
        {
            contents: [{ parts: [{ text: decisionPrompt }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 50 },
        },
        { headers: { "Content-Type": "application/json" }, params: { key: GEMINI_API_KEY } }
    );

    const responseText = decisionRes.data.candidates[0]?.content?.parts[0]?.text?.trim().toUpperCase() || '';
    console.log(`📈 Gemini raw decision response:\n${responseText}`);





    let combinedReasonText = 'No reasoning provided.';



    const reasoningPrompt = `
I bought shares in the following companies. Help me understand why the decisions were good or bad, based on geopolitical events and social sentiment:

${responseText}
for dates refer to this: ${companyList}
Specifically, tell me:
- What significant geopolitical events affected these stocks.
- How sentiment on Reddit and X evolved during this period.

Give concise 2-3 sentence reasoning **for each stock**, labelled clearly.


`.trim();

    const reasonRes = await axios.post(
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
        {
            contents: [{ parts: [{ text: reasoningPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 100 },
        },
        { headers: { "Content-Type": "application/json" }, params: { key: GEMINI_API_KEY } }
    );

    combinedReasonText = reasonRes.data.candidates[0]?.content?.parts[0]?.text?.trim() || combinedReasonText;
    console.log(`🧠 Combined Gemini reasoning:\n${combinedReasonText}`);






    return { score: responseText, reasoning: combinedReasonText, Type: 'PORTFOLIO_GEO_POLITICS', correlationId };
};


const Starter = async () => {
    const queueConnection = await connectQueue();
    channel = queueConnection.channel;

    await channel.assertQueue('task_queue', { durable: true });
    await channel.assertQueue('response_queue', { durable: true });
    await channel.assertQueue('master_response_aggregator_queue', { durable: true });

    console.log('📊 Strategy Server is waiting for messages...');

    channel.consume('task_queue', async (msg: any) => {
        if (!msg) return;

        const parsedMsg = JSON.parse(msg.content.toString());

        if (parsedMsg.Task === 'PORTFOLIO_STRATERGY') {
            console.log("message recived here")
            const response = await doStuff(parsedMsg);
            console.log('Response to be sent:', response);
            channel.sendToQueue("master_response_aggregator_queue", Buffer.from(JSON.stringify({
                Type: "PORTFOLIO_GEO_POLITICS", // ✅ FIX THIS
                data: response
            })), {
                correlationId: msg.properties.correlationId
            });

            //send to master server queue
            channel.sendToQueue('master_response_aggregator_queue', Buffer.from(JSON.stringify(response)), { persistent: true });
            // console.log(`✅ Sent decision: ${decision} for ${stockSymbol} | Reason: ${reasonText}`);

        }

        if (parsedMsg.Task !== 'STRATEGY') {
            channel.ack(msg);
            return;
        }

        const {
            correlationId,
            stockSymbol,
            quantity,
            boughtDayPrice,
            boughtDayDate,
            predictedDayDate,
            predictedPrice
        } = parsedMsg;


        if (!boughtDayDate || !predictedDayDate || !predictedPrice) {
            console.error('❌ Critical data missing (dates or predicted price). Aborting.');
            channel.ack(msg);
            return;
        }

        try {
            if (!GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY is not defined. Please set it in your .env file.');
            }

            // 🎯 Decision prompt: Focused on profit comparison and trends
            const decisionPrompt = `
You are a stock trading assistant specializing in momentum strategies.

I am currently considering whether I should buy more shares of ${stockSymbol}.

Here are the stock details:
- Stock Symbol: ${stockSymbol}
- Quantity: ${quantity}
- Bought Day Price: ${boughtDayPrice}
- Predicted Future Price: ${predictedPrice}

Period of analysis: From ${boughtDayDate} to ${predictedDayDate}

Consider:
- Price trends
- Momentum signals
- Geopolitical events
- Sentiment on Reddit
- Sentiment on X (formerly Twitter)

Do you think buying more of this stock is a good idea?  
Answer strictly "YES" if you think I should buy more, or "NO" if you think I should not buy more. Do not give explanations here.

`;

            const geminiResponse = await axios.post(
                "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
                {
                    contents: [{ parts: [{ text: decisionPrompt }] }],
                    generationConfig: { temperature: 0, maxOutputTokens: 5 },
                },
                { headers: { "Content-Type": "application/json" }, params: { key: GEMINI_API_KEY } }
            );

            const responseText = geminiResponse.data.candidates[0]?.content?.parts[0]?.text?.trim().toUpperCase() || '';
            console.log(`📈 Gemini decision response for ${stockSymbol}: ${responseText}`);

            const decision = responseText.includes('YES') ? 'BUY' : 'NO_BUY';

            // 🔍 Reasoning prompt: tightly focused, with clear constraints
            const reasonPrompt = `
During the period between ${boughtDayDate} and ${predictedDayDate}, I bought shares of ${stockSymbol}.

It turned out to be a ${decision === "BUY" ? "good" : "bad"} decision.

Help me understand why this decision was ${decision === "BUY" ? "good" : "bad"}.

Specifically, tell me:
- What significant geopolitical events occurred during this time that could have affected ${stockSymbol}.
- How the sentiment on Reddit and X (formerly Twitter) evolved regarding ${stockSymbol} in this period.

Give me a concise, fact-based explanation in 2-3 sentences.

`;


            const reasonResponse = await axios.post(
                "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
                {
                    contents: [{ parts: [{ text: reasonPrompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 80 },
                },
                { headers: { "Content-Type": "application/json" }, params: { key: GEMINI_API_KEY } }
            );

            const reasonText = reasonResponse.data.candidates[0]?.content?.parts[0]?.text?.trim() || 'Reason not provided.';

            console.log('--- Final Response ---');
            console.log('Decision:', decision);
            console.log('Reason:', reasonText);

            const response = {
                correlationId,
                strategy: 'GEMINI_AI',
                stockSymbol,
                decision,
                confidence: 'Based on Gemini AI decision and reasoning',
                reason: reasonText
            };

            console.log('Response to be sent:', response);

            //send to master server queue
            channel.sendToQueue('master_response_aggregator_queue', Buffer.from(JSON.stringify(response)), { persistent: true });
            console.log(`✅ Sent decision: ${decision} for ${stockSymbol} | Reason: ${reasonText}`);

        } catch (err: any) {
            console.error('❌ Gemini API error:', err.message);
            if (err.response) {
                console.error('Gemini API Response Data:', err.response.data);
                console.error('Gemini API Response Status:', err.response.status);
                console.error('Gemini API Response Headers:', err.response.headers);
            }
            const errorResponse = {
                correlationId,
                strategy: 'Geo-politics + Social media sentiment',
                stockSymbol,
                decision: 'ERROR',
                error: err.response ? err.response.data : err.message || 'Unknown error'
            };
            channel.sendToQueue('response_queue', Buffer.from(JSON.stringify(errorResponse)), { persistent: true });
            console.error(`❌ Error processing message for ${stockSymbol}:`, err.message);
        } finally {
            channel.ack(msg);
        }
    }, { noAck: false });
};

Starter().catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
});

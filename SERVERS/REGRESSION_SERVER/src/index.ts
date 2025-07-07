import amqp from 'amqplib';
import yahooFinance from 'yahoo-finance2';
import * as tf from '@tensorflow/tfjs';

const requestQueue = 'task_queue';
const responseQueue = 'response_queue';

async function startRegressionServer() {
    const connection = await amqp.connect('amqp://localhost').then((conn) => {
        console.log('✅ Connected to RabbitMQ');
        return conn;
    }).catch((err) => {
        console.error('❌ Failed to connect to RabbitMQ', err);
        process.exit(1);
    });

    const channel = await connection.createChannel();
    await channel.assertQueue(requestQueue, { durable: true });
    await channel.assertQueue(responseQueue, { durable: true });

    // strategy 2 queues
    await channel.assertQueue('st2_queue', { durable: true });
    await channel.assertQueue('mean_reversion_queue', { durable: true });

    // master_server queue
    await channel.assertQueue('master_response_aggregator_queue', { durable: true });

    console.log('📊 Regression Server is waiting for messages...');

    channel.consume(requestQueue, async (msg) => {
        if (!msg) return;
        let parsedMsg;

        try {
            parsedMsg = JSON.parse(msg.content.toString());
        } catch (err) {
            console.error('❌ Failed to parse message JSON');
            channel.ack(msg);
            return;
        }

        if (parsedMsg.Task !== 'REGRESSION') {
            channel.ack(msg);
            return;
        }

        const { stockSymbol, startDate, endDate, correlationId, yahoo_data } = parsedMsg;
        console.log(`📥 Regression request received for ${stockSymbol}`);
        console.log('Correlation ID:', correlationId);
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);

        // 🚫 Abort if dates are unspecified
        if (!startDate || !endDate) {
            console.error('❌ Start date or end date is unspecified. Aborting processing.');
            channel.ack(msg);
            return;
        }

        try {
            const result = yahoo_data;
            if (!result || result.length < 3) throw new Error('Insufficient valid data (Need at least 3 data points)');

            const prices = result.map((entry: any) => entry.close).filter((price: number | null): price is number => price !== null);
            if (prices.length < 3) throw new Error('Insufficient valid price data');

            const days = Array.from({ length: prices.length }, (_, i) => i + 1);

            // Normalization
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const scaledPrices = prices.map((p: any) => (p - minPrice) / (maxPrice - minPrice));
            const maxDay = Math.max(...days);
            const scaledDays = days.map(d => d / maxDay);

            const xs = tf.tensor2d(scaledDays, [scaledDays.length, 1]);
            const ys = tf.tensor2d(scaledPrices, [scaledPrices.length, 1]);

            const model = tf.sequential();
            model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
            model.compile({ optimizer: tf.train.sgd(0.01), loss: 'meanSquaredError' });

            await model.fit(xs, ys, { epochs: 500, verbose: 0 });

            const nextDayNormalized = (days.length + 1) / maxDay;
            const prediction = model.predict(tf.tensor2d([[nextDayNormalized]])) as tf.Tensor;

            const predictedScaled = (await prediction.array() as number[][])[0][0];
            const predictedPrice = predictedScaled * (maxPrice - minPrice) + minPrice;

            if (isNaN(predictedPrice)) throw new Error('Prediction resulted in NaN');

            console.log(`📈 Predicted price for ${stockSymbol} on next day: $${predictedPrice.toFixed(2)}`);

            const responsePayload = {
                correlationId,
                stockSymbol,
                predictedPrice: predictedPrice.toFixed(2),
                boughtDayPrice: prices[0].toFixed(2),
                boughtDayDate: result[0].date,
                predictedDayDate: result[result.length - 1].date,
                quantity: parsedMsg.quantity,

                Task: 'STRATEGY',
                yahoo_data: result
            };

            console.log('--- Response to be sent ---');
            console.log(responsePayload);

            const response = JSON.stringify(responsePayload);

            // Send to strategy 1 queue
            channel.sendToQueue('task_queue', Buffer.from(response), { persistent: true });

            // Send to strategy 2 queue
            channel.sendToQueue('st2_queue', Buffer.from(response), { persistent: true });

            //send to mean reversion strategy queue
            channel.sendToQueue('mean_reversion_queue', Buffer.from(response), {
                persistent: true
            });

            // Send to master server queue
            channel.sendToQueue('master_response_aggregator_queue', Buffer.from(response), {
                persistent: true
            });

            console.log(`✅ Regression completed for ${stockSymbol}, response sent to strategy queues.`);

        } catch (err: any) {
            console.error(`❌ Error processing regression for ${stockSymbol}:`, err.message);

            const errorResponse = JSON.stringify({
                correlationId,
                stockSymbol,
                error: err.message
            });

            channel.sendToQueue(responseQueue, Buffer.from(errorResponse), { persistent: true });
        }

        channel.ack(msg);
    });
}

startRegressionServer();

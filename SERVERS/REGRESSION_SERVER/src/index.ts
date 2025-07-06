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

        const { stockSymbol, startDate, endDate, correlationId } = parsedMsg;
        console.log(`📥 Regression request received for ${stockSymbol}`);

        try {
            const queryOptions = { period1: startDate, period2: endDate, interval: '1d' as '1d' };
            const result = await yahooFinance.historical(stockSymbol, queryOptions) as any[];

            if (!result || result.length < 3) throw new Error('Insufficient valid data (Need at least 3 data points)');

            const prices = result.map(entry => entry.close).filter((price: number | null) => price !== null);
            if (prices.length < 3) throw new Error('Insufficient valid price data');

            const days = Array.from({ length: prices.length }, (_, i) => i + 1);

            // Normalization (Min-Max Scaling)
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const scaledPrices = prices.map(p => (p - minPrice) / (maxPrice - minPrice));
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

            const actual_rate = prices[prices.length - 1];
            const bought_day_price = prices[0];
            const predicted_profit = predictedPrice - bought_day_price;
            const actual_profit = actual_rate - bought_day_price;
            const error_percentage = Math.abs(predicted_profit - actual_profit) / Math.abs(actual_profit) * 100;
            console.log(`💰 Predicted Profit: $${predicted_profit.toFixed(2)}, Actual Profit: $${actual_profit.toFixed(2)}, Error: ${error_percentage}`);



            const response = JSON.stringify({
                correlationId,
                stockSymbol,
                predictedPrice: predictedPrice.toFixed(2),
                actualRate: actual_rate.toFixed(2),
                boughtDayPrice: bought_day_price.toFixed(2),
                boughtDayDate: result[0].date.toISOString().split('T')[0],
                predictedDayDate: new Date(result[result.length - 1].date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                quantity: parsedMsg.quantity,
                predictedProfit: predicted_profit.toFixed(2),
                actualProfit: actual_profit.toFixed(2),
                errorPercentage: error_percentage.toFixed(2),
                Task: 'STRATEGY'

            });

            channel.sendToQueue('task_queue', Buffer.from(response), { persistent: true });
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

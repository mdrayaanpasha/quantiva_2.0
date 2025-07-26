import amqp from 'amqplib';
import * as tf from '@tensorflow/tfjs';

const REQUEST_QUEUE = 'task_queue';
const MASTER_AGGREGATOR_QUEUE = 'master_response_aggregator_queue';
const STRATEGY_1_QUEUE = 'task_queue';
const STRATEGY_2_QUEUE = 'st2_queue';
const MEAN_REVERSION_QUEUE = 'mean_reversion_queue';

/**
 * Predicts the next day price using TensorFlow.js linear regression.
 * @param prices Array of closing prices
 * @returns Predicted price for the next day
 */
async function predictNextDayPrice(prices: number[]): Promise<number> {
    const days = Array.from({ length: prices.length }, (_, i) => i + 1);

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

    return predictedScaled * (maxPrice - minPrice) + minPrice;
}

async function startRegressionServer() {
    try {
        const connection = await amqp.connect('amqp://localhost');
        console.log('✅ Connected to RabbitMQ');

        const channel = await connection.createChannel();

        await channel.assertQueue(REQUEST_QUEUE, { durable: true });
        await channel.assertQueue(MASTER_AGGREGATOR_QUEUE, { durable: true });
        await channel.assertQueue(STRATEGY_2_QUEUE, { durable: true });
        await channel.assertQueue(MEAN_REVERSION_QUEUE, { durable: true });

        channel.prefetch(1);
        console.log('📊 Regression Server is waiting for messages...');

        channel.consume(REQUEST_QUEUE, async (msg) => {
            if (!msg) return;

            let parsedMsg;
            try {
                parsedMsg = JSON.parse(msg.content.toString());
            } catch (err) {
                console.error('❌ Failed to parse message JSON. Discarding message.');
                channel.ack(msg);
                return;
            }




            try {
                if (parsedMsg.Task === 'REGRESSION') {
                    const { stockSymbol, correlationId, Task, yahoo_data } = parsedMsg;
                    console.log(`📥 [${Task}] request received for ${stockSymbol} (ID: ${correlationId})`);
                    if (!parsedMsg.startDate || !parsedMsg.endDate) {
                        throw new Error('Start date or end date is unspecified.');
                    }

                    const result = yahoo_data;
                    if (!result || result.length < 3) {
                        throw new Error('Insufficient historical data (Need at least 3 data points)');
                    }

                    const prices = result.map((entry: any) => entry.close).filter((price: number | null): price is number => price !== null);
                    if (prices.length < 3) {
                        throw new Error('Insufficient valid price data after filtering');
                    }

                    const predictedPrice = await predictNextDayPrice(prices);
                    if (isNaN(predictedPrice)) {
                        throw new Error('Prediction resulted in NaN');
                    }

                    console.log(`📈 Predicted price for ${stockSymbol} on next day: $${predictedPrice.toFixed(2)}`);

                    const responsePayload = {
                        correlationId,
                        stockSymbol,
                        predictedPrice: predictedPrice.toFixed(2),
                        boughtDayPrice: prices[0]?.toFixed(2),
                        boughtDayDate: result[0]?.date,
                        predictedDayDate: result[result.length - 1]?.date,
                        quantity: parsedMsg.quantity,
                        yahoo_data: result,
                        Task: '',
                    };
                    responsePayload.Task = 'STRATEGY';
                    const response = JSON.stringify(responsePayload);
                    channel.sendToQueue(STRATEGY_1_QUEUE, Buffer.from(response), { persistent: true });
                    channel.sendToQueue(STRATEGY_2_QUEUE, Buffer.from(response), { persistent: true });
                    channel.sendToQueue(MEAN_REVERSION_QUEUE, Buffer.from(response), { persistent: true });
                    channel.sendToQueue(MASTER_AGGREGATOR_QUEUE, Buffer.from(response), { persistent: true });
                    console.log(`✅ [${Task}] completed for ${stockSymbol}, response sent to strategy queues.`);



                } else {
                    // getting Q REQ BODY
                    console.log("im computing here in regression_only.....")
                    const { companyInfoArray, correlationId, Task } = parsedMsg;
                    if (!companyInfoArray) {
                        console.error('❌ Failed to parse message JSON. Discarding message.');
                        channel.ack(msg);
                    }
                    try {
                        const responseList = await Promise.all(



                            // goin thru all companies.
                            companyInfoArray.map(async (company: any) => {
                                const { stockSymbol, yahoo_data } = company;
                                console.log(`📥 [${Task}] request received for ${stockSymbol} (ID: ${correlationId})`);

                                if (!company.startDate || !company.endDate) {
                                    throw new Error('Start date or end date is unspecified.');
                                }

                                const result = yahoo_data;
                                if (!result || result.length < 3) {
                                    throw new Error('Insufficient historical data (Need at least 3 data points)');
                                }

                                const prices = result
                                    .map((entry: any) => entry.close)
                                    .filter((price: number | null): price is number => price !== null);

                                if (prices.length < 3) {
                                    throw new Error('Insufficient valid price data after filtering');
                                }

                                // prediction for it.
                                const predictedPrice = await predictNextDayPrice(prices);
                                if (isNaN(predictedPrice)) {
                                    throw new Error('Prediction resulted in NaN');
                                }

                                console.log(`📈 Predicted price for ${stockSymbol} on next day: $${predictedPrice.toFixed(2)}`);

                                return {
                                    correlationId,
                                    stockSymbol,
                                    predictedPrice: predictedPrice.toFixed(2),
                                    boughtDayPrice: prices[0]?.toFixed(2),
                                    boughtDayDate: result[0]?.date,
                                    predictedDayDate: result[result.length - 1]?.date,
                                    quantity: company.quantity,
                                    yahoo_data: result
                                };
                            })
                        );

                        // Append type info
                        const finalResponse = {
                            type: 'multiple',
                            data: responseList,
                            correlationId,
                            Task: 'REGRESSION_ONLY_RESPONSE' // 👈 Add this
                        };


                        // Send to aggregator
                        channel.sendToQueue(
                            MASTER_AGGREGATOR_QUEUE,
                            Buffer.from(JSON.stringify(finalResponse)),
                            { persistent: true }
                        );
                        console.log(finalResponse)

                        console.log(`✅ [${Task}] All company predictions completed and sent to master aggregator.`);
                    } catch (error) {
                        console.error(`❌ Error during REGRESSION_ONLY task:`, error);
                        // Optionally send failure message here
                    }
                }

            }
            catch (err: any) {
                console.error(`❌ Error processing regression:`, err.message);
                const errorResponse = JSON.stringify({

                    error: err.message
                });
                channel.sendToQueue(MASTER_AGGREGATOR_QUEUE, Buffer.from(errorResponse), { persistent: true });
            } finally {

                channel.ack(msg);
            }

        });

    } catch (err) {
        console.error('❌ Failed to connect or setup RabbitMQ channel', err);
        process.exit(1);
    }
}

startRegressionServer();

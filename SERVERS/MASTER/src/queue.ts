import amqp from 'amqplib';

const RABBITMQ_URL = 'amqp://localhost'; // Update if needed

export async function connectQueue() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        console.log('✅ Connected to RabbitMQ');

        return { connection, channel };
    } catch (err) {
        console.error('❌ Failed to connect to RabbitMQ', err);
        process.exit(1);
    }
}

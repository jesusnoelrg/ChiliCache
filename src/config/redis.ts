import { createClient } from 'redis';
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (error) => console.error('[Redis Client]: ' + error));

(async () => {
  await redisClient.connect();
  console.log('Conectado a Redis exitosamente.');
})();

export default redisClient;
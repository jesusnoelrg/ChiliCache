import { createClient } from 'redis';
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.log('Nombre del error:', err.name);
  console.log('Constructor:', err.constructor.name);

  if (err.errors && Array.isArray(err.errors)){
    console.error(`Error detectado: ${err.code || 'MULTIPLE_ERRORS'}`);

    err.errors.forEach((subErr: any, index: number) => {
      console.error(`   └─ Fallo ${index + 1}: ${subErr.message}`);
      console.error(`      Código: ${subErr.code}`);
    });
  } else {
    console.error('[ERROR] (redis): ' + err.message);
  }
});

(async () => {
  await redisClient.connect();
  console.log('Conectado a Redis exitosamente.');
})();

export default redisClient;
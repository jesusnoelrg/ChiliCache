import { createClient } from 'redis';
import dotenv from "dotenv";

dotenv.config();

function normalizeRedisUrl(raw: string | undefined): string {
  let url = (raw || 'redis://localhost:6379').trim();
  url = url.replace(/^REDIS_URL\s*=\s*/i, '');
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }
  return url.trim();
}

const redisUrl = normalizeRedisUrl(process.env.REDIS_URL);

if (process.env.MODE === 'production' && /localhost|127\.0\.0\.1/.test(redisUrl)) {
  console.error(
    '[ERROR] REDIS_URL no está configurada. En Fly.io ejecuta:\n' +
    '  fly secrets set REDIS_URL="rediss://default:TOKEN@tu-host.upstash.io:6379"'
  );
  process.exit(1);
}

const useTls = redisUrl.startsWith('rediss://');

const redisClient = createClient({
  url: redisUrl,
  ...(useTls ? { socket: { tls: true, rejectUnauthorized: false } } : {}),
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

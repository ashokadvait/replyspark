import { ENV } from './config/env.js';
import { createFastifyApp } from './app.js';

async function main() {
  const fastify = await createFastifyApp();

  try {
    await fastify.listen({ port: ENV.PORT, host: ENV.HOST });
    console.log(`🚀 ReplySpark Fastify REST API running on http://localhost:${ENV.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

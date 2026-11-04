import fs from 'node:fs';
import path from 'node:path';

// Load root .env in monorepo development if variables aren't already set by the platform (e.g. Vercel)
const rootEnvPath = path.resolve(process.cwd(), '../../.env');
if (fs.existsSync(rootEnvPath)) {
  const lines = fs.readFileSync(rootEnvPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), '../../'),
  outputFileTracingIncludes: {
    '/api/**/*': [
      '../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**/*',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/**/*'
    ]
  },
  serverExternalPackages: [
    '@replyspark/api',
    '@replyspark/db',
    '@prisma/client',
    'prisma',
    'bcryptjs',
    'fastify',
    '@fastify/cors',
    '@fastify/jwt',
    '@fastify/sensible',
    'ioredis',
    'bullmq'
  ]
};

export default nextConfig;

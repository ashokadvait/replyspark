import dotenv from 'dotenv';
import path from 'path';

const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const envFile = isProd ? '.env.production' : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '../../', envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '',
  WEB_URL: process.env.WEB_URL || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GOOGLE_PROVIDER_MODE: process.env.GOOGLE_PROVIDER_MODE || 'mock',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || ''
};

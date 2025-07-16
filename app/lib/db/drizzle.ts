import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Only throw error in runtime, not during build
if (!process.env.POSTGRES_URL && process.env.NODE_ENV !== 'production') {
  console.warn('POSTGRES_URL environment variable is not set. Database operations will fail.');
}

const connectionString = process.env.POSTGRES_URL || 'postgres://user:password@localhost:5432/database';
export const client = postgres(connectionString);
export const db = drizzle(client, { schema });

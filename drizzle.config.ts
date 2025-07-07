import type { Config } from 'drizzle-kit';

export default {
  schema: './app/lib/db/schema.ts',
  out: './app/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;

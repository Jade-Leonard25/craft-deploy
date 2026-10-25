import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';
import dotenv from 'dotenv';
dotenv.config();
config({ path: '.env' }); // or .env.local
 const db = drizzle({ connection: {
  url: process.env.TURSO_DATABASE_MAIN_URL!,
  authToken: process.env.TURSO_TOKENS!,
}});

export default db


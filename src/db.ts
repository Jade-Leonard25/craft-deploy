import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';
import dotenv from 'dotenv';
dotenv.config();
config({ path: '.env' }); // or .env.local
 const db = drizzle({ connection: {
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN!,
}});

export default db


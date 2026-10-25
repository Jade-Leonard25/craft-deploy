import {defineConfig} from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();
export default defineConfig({
    dialect:"turso",
    dbCredentials:{
        url:process.env.TURSO_DATABASE_MAIN_URL as string,
        authToken:process.env.TURSO_TOKENS as string
    },
    schema:'./src/schema/schema.ts',
    out:'migration',
    schemaFilter:["public"]
})

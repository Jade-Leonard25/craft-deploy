import {config} from 'dotenv'
import {defineConfig} from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();
config({path:".env"});
export default defineConfig({
    dialect: "turso",
    dbCredentials:{
        url:process.env.DATABASE_URL as string,
        authToken:process.env.DATABASE_TOKEN as string},

    schema:'./src/schema/schema.ts',
    out:'migration',
    schemaFilter:["public"]
})

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Supabase Transaction Pooler / Next.js Singleton Pattern
declare global {
  // eslint-disable-next-line no-var
  var _postgresClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var _drizzleDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const client =
  globalThis._postgresClient ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 10,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis._postgresClient = client;
}

export const db =
  globalThis._drizzleDb ??
  drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis._drizzleDb = db;
}

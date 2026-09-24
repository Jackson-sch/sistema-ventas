import postgres from "postgres";

const connectionString = "postgresql://postgres.pccrqvvhgvibjsfdvgxe:uHMK883xRGOMx12W@aws-0-ca-central-1.pooler.supabase.com:6543/postgres";

async function testConnection() {
  console.log("Connecting to Supabase database...");
  const sql = postgres(connectionString, {
    prepare: false,
    connect_timeout: 10,
    ssl: "require",
  });

  try {
    const result = await sql`SELECT NOW() as current_time;`;
    console.log("Database connected successfully:", result);

    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("Tables in public schema:", tables.map(t => t.table_name));

    try {
      const tenants = await sql`SELECT * FROM "tenants" LIMIT 5;`;
      console.log("Tenants found:", tenants);
    } catch (err) {
      console.error("Error querying tenants table:", err);
    }

  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await sql.end();
  }
}

testConnection();

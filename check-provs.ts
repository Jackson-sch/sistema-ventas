import postgres from "postgres";

const conn = "postgresql://postgres.pccrqvvhgvibjsfdvgxe:uHMK883xRGOMx12W@aws-0-ca-central-1.pooler.supabase.com:6543/postgres";

async function checkProvs() {
  const sql = postgres(conn, { prepare: false });

  try {
    const rows = await sql`SELECT id, razon_social, ruc FROM proveedores;`;
    console.log("Total proveedores in DB:", rows.length);
    console.log(rows);
  } catch (e: any) {
    console.error("Error:", e.message);
  } finally {
    await sql.end();
  }
}

checkProvs().catch(console.error);

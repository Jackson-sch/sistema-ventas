import postgres from "postgres";

const conn = "postgresql://postgres.pccrqvvhgvibjsfdvgxe:uHMK883xRGOMx12W@aws-0-ca-central-1.pooler.supabase.com:6543/postgres";

async function deduplicateSuppliers() {
  const sql = postgres(conn, { prepare: false });

  try {
    console.log("Deduplicating proveedores table...");
    const rows = await sql`
      SELECT id, ruc, razon_social, creado_en 
      FROM proveedores 
      ORDER BY ruc, creado_en ASC;
    `;

    const seenRuc = new Map<string, string>(); // ruc -> primaryId
    const toDelete: string[] = [];
    const replacements: { oldId: string; newId: string }[] = [];

    for (const r of rows) {
      if (!seenRuc.has(r.ruc)) {
        seenRuc.set(r.ruc, r.id);
      } else {
        const primaryId = seenRuc.get(r.ruc)!;
        toDelete.push(r.id);
        replacements.push({ oldId: r.id, newId: primaryId });
      }
    }

    console.log(`Found ${toDelete.length} duplicate suppliers to clean.`);

    // 1. Update any references in ordenes_compra
    for (const rep of replacements) {
      await sql`
        UPDATE ordenes_compra 
        SET proveedor_id = ${rep.newId} 
        WHERE proveedor_id = ${rep.oldId};
      `;
    }

    // 2. Delete the duplicates
    if (toDelete.length > 0) {
      await sql`DELETE FROM proveedores WHERE id IN ${sql(toDelete)};`;
      console.log(`Deleted ${toDelete.length} duplicate supplier rows.`);
    }

    const finalRows = await sql`SELECT id, ruc, razon_social FROM proveedores ORDER BY razon_social;`;
    console.log("Remaining clean suppliers in DB:", finalRows.length);
    console.log(finalRows);
  } catch (e: any) {
    console.error("Deduplication error:", e);
  } finally {
    await sql.end();
  }
}

deduplicateSuppliers().catch(console.error);

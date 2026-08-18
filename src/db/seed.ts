import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, inArray, sql } from "drizzle-orm";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

// ──────────────────────────────────────────────────────────────────────
// Carga de variables de entorno
// ──────────────────────────────────────────────────────────────────────
function loadEnv() {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  const envPath = path.resolve(process.cwd(), ".env");
  const targetPath = fs.existsSync(envLocalPath) ? envLocalPath : fs.existsSync(envPath) ? envPath : null;

  if (targetPath) {
    const content = fs.readFileSync(targetPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString || connectionString.includes("[YOUR-PASSWORD]") || connectionString.includes("placeholder")) {
  console.log("=================================================================");
  console.log("⚠️ ATENCIÓN: DATABASE_URL no tiene una contraseña configurada.");
  console.log("Por favor define tu contraseña en .env.local para conectar a Supabase.");
  console.log("=================================================================");
  process.exit(0);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

// PRNG determinístico: el seed genera los mismos datos en cada corrida.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function r2(n: number) {
  return n.toFixed(2);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgoDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDate(d);
}

function daysAgoTs(days: number, hour: number, minute = 0, second = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, second, 0);
  return d;
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(rng: () => number, arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Patrón get-or-create por clave natural para que el seed sea idempotente.
async function getOrCreateRole(slug: string, values: typeof schema.roles.$inferInsert) {
  const existing = await db.select().from(schema.roles).where(eq(schema.roles.slug, slug)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(schema.roles).values(values).returning();
  return row!;
}

async function getOrCreateSucursal(tenantId: string, nombre: string, values: typeof schema.sucursales.$inferInsert) {
  const existing = await db
    .select()
    .from(schema.sucursales)
    .where(and(eq(schema.sucursales.tenantId, tenantId), eq(schema.sucursales.nombre, nombre)))
    .limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(schema.sucursales).values(values).returning();
  return row!;
}

async function getOrCreateCaja(tenantId: string, nombre: string, values: typeof schema.cajas.$inferInsert) {
  const existing = await db
    .select()
    .from(schema.cajas)
    .where(and(eq(schema.cajas.tenantId, tenantId), eq(schema.cajas.nombre, nombre)))
    .limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(schema.cajas).values(values).returning();
  return row!;
}

async function getOrCreateCategoria(tenantId: string, nombre: string) {
  const existing = await db
    .select()
    .from(schema.categorias)
    .where(and(eq(schema.categorias.tenantId, tenantId), eq(schema.categorias.nombre, nombre)))
    .limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(schema.categorias).values({ tenantId, nombre }).returning();
  return row!;
}

async function getOrCreateProveedor(tenantId: string, ruc: string, values: typeof schema.proveedores.$inferInsert) {
  const existing = await db
    .select()
    .from(schema.proveedores)
    .where(and(eq(schema.proveedores.tenantId, tenantId), eq(schema.proveedores.ruc, ruc)))
    .limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(schema.proveedores).values(values).returning();
  return row!;
}

async function getOrCreateCliente(tenantId: string, numeroDocumento: string, values: typeof schema.clientes.$inferInsert) {
  const existing = await db
    .select()
    .from(schema.clientes)
    .where(and(eq(schema.clientes.tenantId, tenantId), eq(schema.clientes.numeroDocumento, numeroDocumento)))
    .limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(schema.clientes).values(values).returning();
  return row!;
}

async function getOrCreatePermiso(codigo: string, descripcion: string, modulo: string) {
  const existing = await db.select().from(schema.permisos).where(eq(schema.permisos.codigo, codigo)).limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db.insert(schema.permisos).values({ codigo, descripcion, modulo }).returning();
  return row!;
}

// ──────────────────────────────────────────────────────────────────────
// Datos de catálogo
// ──────────────────────────────────────────────────────────────────────

type ProductSeed = {
  sku: string;
  nombre: string;
  marca: string;
  categoria: string;
  unidadMedida?: string;
  tipo?: "unidad" | "peso";
  precioCosto: string;
  precioVenta: string;
  barcode: string;
  stockSurco: string;
  stockSanIsidro: string;
  lote?: string;
  vencimiento?: string;
};

const RAW_PRODUCTS: ProductSeed[] = [
  // ── Lácteos & Huevos ──────────────────────────────────────────────
  { sku: "GLO-001", nombre: "Leche Gloria Entera 400g (Lata)", marca: "Gloria", categoria: "lacteos", precioCosto: "3.20", precioVenta: "4.50", barcode: "7750151000018", stockSurco: "480", stockSanIsidro: "260", lote: "L-2026-081", vencimiento: "2027-02-15" },
  { sku: "GLO-002", nombre: "Yogurt Gloria Fresa 1L", marca: "Gloria", categoria: "lacteos", precioCosto: "5.40", precioVenta: "7.20", barcode: "7750151000025", stockSurco: "120", stockSanIsidro: "70", lote: "L-2026-090", vencimiento: "2026-09-30" },
  { sku: "GLO-003", nombre: "Leche Gloria Entera 1L (Tetra Pak)", marca: "Gloria", categoria: "lacteos", precioCosto: "4.10", precioVenta: "5.60", barcode: "7750151000032", stockSurco: "210", stockSanIsidro: "115", lote: "L-2026-095", vencimiento: "2026-12-20" },
  { sku: "GLO-004", nombre: "Queso Fresco Gloria 200g", marca: "Gloria", categoria: "lacteos", precioCosto: "6.80", precioVenta: "8.90", barcode: "7750151000056", stockSurco: "90", stockSanIsidro: "50", lote: "L-2026-088", vencimiento: "2026-09-05" },
  { sku: "GLO-005", nombre: "Mantequilla Gloria 125g", marca: "Gloria", categoria: "lacteos", precioCosto: "4.40", precioVenta: "5.90", barcode: "7750151000063", stockSurco: "140", stockSanIsidro: "80", lote: "L-2026-089", vencimiento: "2026-10-10" },
  { sku: "LAV-001", nombre: "Yogurt Laive Durazno 1L", marca: "Laive", categoria: "lacteos", precioCosto: "5.60", precioVenta: "7.40", barcode: "7750192000147", stockSurco: "95", stockSanIsidro: "55", lote: "L-2026-092", vencimiento: "2026-09-22" },
  { sku: "LAV-002", nombre: "Yogurt Griego Laive Natural 150g", marca: "Laive", categoria: "lacteos", precioCosto: "2.90", precioVenta: "4.10", barcode: "7750192000154", stockSurco: "160", stockSanIsidro: "85", lote: "L-2026-093", vencimiento: "2026-09-12" },
  { sku: "LAV-003", nombre: "Queso Andino Laive 300g", marca: "Laive", categoria: "lacteos", precioCosto: "9.20", precioVenta: "11.80", barcode: "7750192000161", stockSurco: "75", stockSanIsidro: "40", lote: "L-2026-087", vencimiento: "2026-09-02" },
  { sku: "SAN-001", nombre: "Queso Crema San Jorge 250g", marca: "San Jorge", categoria: "lacteos", precioCosto: "5.10", precioVenta: "6.80", barcode: "7750253000021", stockSurco: "130", stockSanIsidro: "75", lote: "L-2026-091", vencimiento: "2026-10-01" },
  { sku: "HUE-001", nombre: "Huevos Gallina Granja La Calera (30 u)", marca: "La Calera", categoria: "lacteos", unidadMedida: "MAP", precioCosto: "10.50", precioVenta: "13.90", barcode: "7750135000103", stockSurco: "150", stockSanIsidro: "90", lote: "L-2026-094", vencimiento: "2026-09-25" },

  // ── Abarrotes & Despensa ───────────────────────────────────────────
  { sku: "PRI-001", nombre: "Aceite Primor Premium 1L", marca: "Primor", categoria: "abarrotes", precioCosto: "7.50", precioVenta: "9.80", barcode: "7750243000124", stockSurco: "250", stockSanIsidro: "140" },
  { sku: "PRI-002", nombre: "Aceite Primor Premium 2L", marca: "Primor", categoria: "abarrotes", precioCosto: "14.20", precioVenta: "17.90", barcode: "7750243000131", stockSurco: "110", stockSanIsidro: "60" },
  { sku: "COS-001", nombre: "Arroz Costeño Extra 1kg", marca: "Costeño", categoria: "abarrotes", precioCosto: "3.80", precioVenta: "5.20", barcode: "7750182000056", stockSurco: "600", stockSanIsidro: "340" },
  { sku: "COS-002", nombre: "Arroz Costeño Superior 5kg", marca: "Costeño", categoria: "abarrotes", precioCosto: "18.50", precioVenta: "23.50", barcode: "7750182000063", stockSurco: "180", stockSanIsidro: "95" },
  { sku: "DON-001", nombre: "Fideos Don Vittorio Spaghetti 1kg", marca: "Don Vittorio", categoria: "abarrotes", precioCosto: "3.10", precioVenta: "4.60", barcode: "7750182000995", stockSurco: "320", stockSanIsidro: "170" },
  { sku: "DON-002", nombre: "Fideos Don Vittorio Tallarín 500g", marca: "Don Vittorio", categoria: "abarrotes", precioCosto: "1.90", precioVenta: "2.90", barcode: "7750182001008", stockSurco: "280", stockSanIsidro: "150" },
  { sku: "DON-003", nombre: "Fideos Don Vittorio Codito 500g", marca: "Don Vittorio", categoria: "abarrotes", precioCosto: "1.95", precioVenta: "2.95", barcode: "7750182001015", stockSurco: "260", stockSanIsidro: "135" },
  { sku: "MOL-001", nombre: "Fideos Molitalia Spaghetti 500g", marca: "Molitalia", categoria: "abarrotes", precioCosto: "2.10", precioVenta: "3.20", barcode: "7750222000310", stockSurco: "300", stockSanIsidro: "160" },
  { sku: "MOL-002", nombre: "Harina Pan Molitalia 1kg", marca: "Molitalia", categoria: "abarrotes", precioCosto: "3.40", precioVenta: "4.70", barcode: "7750222000402", stockSurco: "240", stockSanIsidro: "130" },
  { sku: "CAR-001", nombre: "Azúcar Rubia Cartavio 1kg", marca: "Cartavio", categoria: "abarrotes", precioCosto: "3.60", precioVenta: "4.90", barcode: "7750115000211", stockSurco: "400", stockSanIsidro: "210" },
  { sku: "PRI-004", nombre: "Aceite Vegetal Olios 900ml", marca: "Olios", categoria: "abarrotes", precioCosto: "8.90", precioVenta: "11.20", barcode: "7750249000051", stockSurco: "160", stockSanIsidro: "85" },
  { sku: "NES-001", nombre: "Café Nescafé Clásico 50g", marca: "Nescafé", categoria: "abarrotes", precioCosto: "4.80", precioVenta: "6.50", barcode: "7750225000115", stockSurco: "200", stockSanIsidro: "110" },
  { sku: "ANC-001", nombre: "Sal de Mar Bayóvar 1kg", marca: "Emsal", categoria: "abarrotes", precioCosto: "1.60", precioVenta: "2.40", barcode: "7750331000018", stockSurco: "220", stockSanIsidro: "120" },
  { sku: "AJI-001", nombre: "Ají No Mototai Molido 90g", marca: "Mototai", categoria: "abarrotes", precioCosto: "2.20", precioVenta: "3.30", barcode: "7750334000122", stockSurco: "190", stockSanIsidro: "100" },
  { sku: "SAB-001", nombre: "Sazonador Ajinomoto 100g", marca: "Ajinomoto", categoria: "abarrotes", precioCosto: "3.30", precioVenta: "4.50", barcode: "7750066000213", stockSurco: "230", stockSanIsidro: "125" },

  // ── Frutas & Verduras (pesables) ───────────────────────────────────
  { sku: "FRU-001", nombre: "Manzana Delicia Nacional", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "2.80", precioVenta: "4.80", barcode: "2000001004801", stockSurco: "85.5", stockSanIsidro: "45.0", lote: "L-2026-086", vencimiento: "2026-08-22" },
  { sku: "FRU-002", nombre: "Plátano Seda", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "1.80", precioVenta: "3.20", barcode: "2000002003205", stockSurco: "120.0", stockSanIsidro: "60.0", lote: "L-2026-087", vencimiento: "2026-08-20" },
  { sku: "FRU-003", nombre: "Papa Amarilla", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "1.50", precioVenta: "2.80", barcode: "2000003003403", stockSurco: "150.0", stockSanIsidro: "80.0", lote: "L-2026-085", vencimiento: "2026-08-25" },
  { sku: "FRU-004", nombre: "Cebolla Roja", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "1.40", precioVenta: "2.60", barcode: "2000004003600", stockSurco: "100.0", stockSanIsidro: "55.0", lote: "L-2026-086", vencimiento: "2026-08-26" },
  { sku: "FRU-005", nombre: "Tomate Italiano", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "2.20", precioVenta: "4.00", barcode: "2000005003808", stockSurco: "90.0", stockSanIsidro: "48.0", lote: "L-2026-086", vencimiento: "2026-08-24" },
  { sku: "FRU-006", nombre: "Limón Sutil", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "3.00", precioVenta: "5.50", barcode: "2000006003905", stockSurco: "70.0", stockSanIsidro: "40.0", lote: "L-2026-087", vencimiento: "2026-08-21" },
  { sku: "FRU-007", nombre: "Palta Hass", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "4.50", precioVenta: "7.90", barcode: "2000007004001", stockSurco: "55.0", stockSanIsidro: "30.0", lote: "L-2026-086", vencimiento: "2026-08-23" },
  { sku: "FRU-008", nombre: "Zanahoria", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "1.30", precioVenta: "2.40", barcode: "2000008004108", stockSurco: "110.0", stockSanIsidro: "60.0", lote: "L-2026-087", vencimiento: "2026-08-27" },
  { sku: "FRU-009", nombre: "Fresa", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "6.00", precioVenta: "9.90", barcode: "2000009004203", stockSurco: "40.0", stockSanIsidro: "22.0", lote: "L-2026-088", vencimiento: "2026-08-19" },
  { sku: "FRU-010", nombre: "Brócoli", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "2.60", precioVenta: "4.60", barcode: "2000010004308", stockSurco: "65.0", stockSanIsidro: "35.0", lote: "L-2026-087", vencimiento: "2026-08-22" },

  // ── Carnes, Pollos & Embutidos ─────────────────────────────────────
  { sku: "SNF-001", nombre: "Pechuga de Pollo San Fernando (Bandeja 1kg)", marca: "San Fernando", categoria: "carnes", unidadMedida: "KG", precioCosto: "10.80", precioVenta: "14.50", barcode: "7750097000315", stockSurco: "60.0", stockSanIsidro: "32.0", lote: "L-2026-089", vencimiento: "2026-08-24" },
  { sku: "SNF-002", nombre: "Bistec de Res (Bandeja 1kg)", marca: "San Fernando", categoria: "carnes", unidadMedida: "KG", precioCosto: "15.50", precioVenta: "19.90", barcode: "7750097000322", stockSurco: "45.0", stockSanIsidro: "24.0", lote: "L-2026-089", vencimiento: "2026-08-23" },
  { sku: "SNF-003", nombre: "Salchicha Hot Dog San Fernando 300g", marca: "San Fernando", categoria: "carnes", precioCosto: "5.20", precioVenta: "7.10", barcode: "7750097000339", stockSurco: "170", stockSanIsidro: "90", lote: "L-2026-088", vencimiento: "2026-09-10" },
  { sku: "SNF-004", nombre: "Jamón de Pavo San Fernando 200g", marca: "San Fernando", categoria: "carnes", precioCosto: "6.30", precioVenta: "8.40", barcode: "7750097000346", stockSurco: "140", stockSanIsidro: "75", lote: "L-2026-089", vencimiento: "2026-09-15" },
  { sku: "SNF-005", nombre: "Tocino Ahumado San Fernando 250g", marca: "San Fernando", categoria: "carnes", precioCosto: "9.80", precioVenta: "12.90", barcode: "7750097000353", stockSurco: "80", stockSanIsidro: "42", lote: "L-2026-088", vencimiento: "2026-09-08" },
  { sku: "SNF-006", nombre: "Pollo Entero San Fernando (Bandeja 1kg)", marca: "San Fernando", categoria: "carnes", unidadMedida: "KG", precioCosto: "7.90", precioVenta: "11.20", barcode: "7750097000360", stockSurco: "85.0", stockSanIsidro: "46.0", lote: "L-2026-089", vencimiento: "2026-08-25" },

  // ── Panadería & Repostería ─────────────────────────────────────────
  { sku: "BMB-001", nombre: "Pan de Molde Blanco Bimbo 580g", marca: "Bimbo", categoria: "panaderia", precioCosto: "4.60", precioVenta: "6.20", barcode: "7750228000216", stockSurco: "120", stockSanIsidro: "65", lote: "L-2026-086", vencimiento: "2026-08-26" },
  { sku: "BMB-002", nombre: "Pan Integral Bimbo 580g", marca: "Bimbo", categoria: "panaderia", precioCosto: "5.10", precioVenta: "6.90", barcode: "7750228000223", stockSurco: "100", stockSanIsidro: "55", lote: "L-2026-086", vencimiento: "2026-08-26" },
  { sku: "DON-004", nombre: "Torta Galesa D'Onofrio", marca: "D'Onofrio", categoria: "panaderia", precioCosto: "3.20", precioVenta: "4.50", barcode: "7750106000211", stockSurco: "90", stockSanIsidro: "48", lote: "L-2026-090", vencimiento: "2026-10-05" },

  // ── Congelados & Helados ───────────────────────────────────────────
  { sku: "NES-002", nombre: "Helado de Crema D'Onofrio 1L", marca: "D'Onofrio", categoria: "congelados", precioCosto: "9.90", precioVenta: "12.90", barcode: "7750106000310", stockSurco: "110", stockSanIsidro: "60", lote: "L-2026-085", vencimiento: "2027-03-15" },
  { sku: "CON-001", nombre: "Mix de Verduras Congeladas 500g", marca: "Bell's", categoria: "congelados", precioCosto: "4.20", precioVenta: "5.80", barcode: "7750271000513", stockSurco: "130", stockSanIsidro: "70", lote: "L-2026-084", vencimiento: "2027-02-01" },
  { sku: "CON-002", nombre: "Papas Fritas Congeladas Dany 1kg", marca: "Dany", categoria: "congelados", precioCosto: "6.10", precioVenta: "8.30", barcode: "7750266000112", stockSurco: "95", stockSanIsidro: "50", lote: "L-2026-084", vencimiento: "2027-01-20" },
  { sku: "CON-003", nombre: "Empanadas de Carne Congeladas (10 u)", marca: "Piedad", categoria: "congelados", precioCosto: "8.40", precioVenta: "11.20", barcode: "7750288000210", stockSurco: "70", stockSanIsidro: "38", lote: "L-2026-086", vencimiento: "2027-03-01" },

  // ── Limpieza & Cuidado del Hogar ───────────────────────────────────
  { sku: "BOL-001", nombre: "Detergente Bolívar Floral 1kg", marca: "Bolívar", categoria: "limpieza", precioCosto: "6.20", precioVenta: "8.50", barcode: "7750124001923", stockSurco: "180", stockSanIsidro: "95" },
  { sku: "BOL-002", nombre: "Detergente Bolívar Triple Acción 2kg", marca: "Bolívar", categoria: "limpieza", precioCosto: "11.30", precioVenta: "14.90", barcode: "7750124001930", stockSurco: "120", stockSanIsidro: "65" },
  { sku: "ALA-001", nombre: "Lavavajillas Ala Manzana 500ml", marca: "Ala", categoria: "limpieza", precioCosto: "4.90", precioVenta: "6.60", barcode: "7750271000421", stockSurco: "150", stockSanIsidro: "80" },
  { sku: "CLO-001", nombre: "Clorox Ropa Blanca 3.7L", marca: "Clorox", categoria: "limpieza", precioCosto: "8.10", precioVenta: "10.50", barcode: "7750203000118", stockSurco: "90", stockSanIsidro: "48" },
  { sku: "SAP-001", nombre: "Jabón Sapolio Clásico 300g", marca: "Sapolio", categoria: "limpieza", precioCosto: "2.30", precioVenta: "3.40", barcode: "7750128000112", stockSurco: "260", stockSanIsidro: "140" },
  { sku: "SAP-002", nombre: "Jabón Sapolio Limón 300g", marca: "Sapolio", categoria: "limpieza", precioCosto: "2.30", precioVenta: "3.40", barcode: "7750128000129", stockSurco: "240", stockSanIsidro: "130" },
  { sku: "PAP-001", nombre: "Papel Higiénico Suave Elite 4 x 25m", marca: "Elite", categoria: "limpieza", precioCosto: "5.60", precioVenta: "7.40", barcode: "7750085000423", stockSurco: "320", stockSanIsidro: "170" },
  { sku: "PAP-002", nombre: "Papel Toalla Suave Elite", marca: "Elite", categoria: "limpieza", precioCosto: "4.30", precioVenta: "5.90", barcode: "7750085000522", stockSurco: "200", stockSanIsidro: "105" },

  // ── Higiene & Cuidado Personal ─────────────────────────────────────
  { sku: "KIM-001", nombre: "Toallas Femeninas Kotex Clásica", marca: "Kotex", categoria: "higiene", precioCosto: "3.80", precioVenta: "5.20", barcode: "7750185000210", stockSurco: "170", stockSanIsidro: "90" },
  { sku: "REX-001", nombre: "Desodorante Rexona Original 50ml", marca: "Rexona", categoria: "higiene", precioCosto: "7.40", precioVenta: "9.90", barcode: "7750261000108", stockSurco: "130", stockSanIsidro: "70" },
  { sku: "SED-001", nombre: "Champú Sedal Anticaspa 200ml", marca: "Sedal", categoria: "higiene", precioCosto: "8.20", precioVenta: "10.90", barcode: "7750099000211", stockSurco: "110", stockSanIsidro: "58" },
  { sku: "COL-001", nombre: "Pasta Dental Colgate Triple Acción 120g", marca: "Colgate", categoria: "higiene", precioCosto: "3.60", precioVenta: "4.90", barcode: "7750201000218", stockSurco: "240", stockSanIsidro: "125" },
  { sku: "LUX-001", nombre: "Jabón Lux Rose 90g", marca: "Lux", categoria: "higiene", precioCosto: "2.10", precioVenta: "3.10", barcode: "7750245000113", stockSurco: "280", stockSanIsidro: "150" },

  // ── Bebidas & Gaseosas ─────────────────────────────────────────────
  { sku: "INC-001", nombre: "Gaseosa Inca Kola 3L", marca: "Inca Kola", categoria: "bebidas", precioCosto: "8.10", precioVenta: "10.90", barcode: "7750051000291", stockSurco: "220", stockSanIsidro: "120" },
  { sku: "COC-001", nombre: "Gaseosa Coca-Cola 2.25L", marca: "Coca-Cola", categoria: "bebidas", precioCosto: "7.60", precioVenta: "10.20", barcode: "7750142000290", stockSurco: "240", stockSanIsidro: "130" },
  { sku: "SPR-001", nombre: "Gaseosa Sprite 1.5L", marca: "Sprite", categoria: "bebidas", precioCosto: "5.40", precioVenta: "7.30", barcode: "7750142000382", stockSurco: "180", stockSanIsidro: "95" },
  { sku: "KOL-001", nombre: "Gaseosa Kola Real 2L", marca: "Kola Real", categoria: "bebidas", precioCosto: "4.60", precioVenta: "6.30", barcode: "7750258000108", stockSurco: "200", stockSanIsidro: "105" },
  { sku: "SLU-001", nombre: "Agua San Luis 2.5L", marca: "San Luis", categoria: "bebidas", precioCosto: "3.40", precioVenta: "4.60", barcode: "7750320000286", stockSurco: "260", stockSanIsidro: "140" },
  { sku: "CIE-001", nombre: "Agua Cielo 1L", marca: "Cielo", categoria: "bebidas", precioCosto: "1.70", precioVenta: "2.50", barcode: "7750164000221", stockSurco: "300", stockSanIsidro: "160" },
  { sku: "CRI-001", nombre: "Cerveza Cristal 620ml (Pack x 6)", marca: "Cristal", categoria: "bebidas", precioCosto: "16.90", precioVenta: "21.90", barcode: "7750221000301", stockSurco: "90", stockSanIsidro: "48" },
  { sku: "FRU-011", nombre: "Jugo Frugos Fresa 1L", marca: "Frugos", categoria: "bebidas", precioCosto: "5.10", precioVenta: "6.90", barcode: "7750341000201", stockSurco: "120", stockSanIsidro: "65" },
  { sku: "PUL-001", nombre: "Néctar Pulp Naranja 1.5L", marca: "Pulp", categoria: "bebidas", precioCosto: "7.20", precioVenta: "9.50", barcode: "7750225000313", stockSurco: "100", stockSanIsidro: "55" },

  // ── Bebés & Maternidad ─────────────────────────────────────────────
  { sku: "PAM-001", nombre: "Pañales Pampers Recién Nacido x26", marca: "Pampers", categoria: "bebes", precioCosto: "13.90", precioVenta: "17.90", barcode: "7750118000422", stockSurco: "70", stockSanIsidro: "38" },
  { sku: "NID-001", nombre: "Leche en Polvo Nido Kinder 1+ 400g", marca: "Nestlé", categoria: "bebes", precioCosto: "22.50", precioVenta: "27.90", barcode: "7750243000421", stockSurco: "55", stockSanIsidro: "30", lote: "L-2026-083", vencimiento: "2027-06-01" },
  { sku: "BAB-001", nombre: "Compotas Nestum Varias Frutas 6 x 113g", marca: "Nestlé", categoria: "bebes", precioCosto: "9.80", precioVenta: "12.60", barcode: "7750243000438", stockSurco: "65", stockSanIsidro: "35", lote: "L-2026-085", vencimiento: "2027-01-15" },

  // ── Mascotas & Veterinaria ─────────────────────────────────────────
  { sku: "RIC-001", nombre: "Alimento Ricocan Adulto 1kg", marca: "Ricocan", categoria: "mascotas", precioCosto: "7.80", precioVenta: "10.40", barcode: "7750366000107", stockSurco: "140", stockSanIsidro: "75" },
  { sku: "RIC-002", nombre: "Alimento Ricocat Adulto 1kg", marca: "Ricocat", categoria: "mascotas", precioCosto: "9.30", precioVenta: "12.40", barcode: "7750366000114", stockSurco: "100", stockSanIsidro: "55" },
  { sku: "WHI-001", nombre: "Sobres Whiskas Pollo 3 x 85g", marca: "Whiskas", categoria: "mascotas", precioCosto: "6.40", precioVenta: "8.60", barcode: "7750366000121", stockSurco: "120", stockSanIsidro: "65" },

  // ── Snacks & Confitería ────────────────────────────────────────────
  { sku: "LAY-001", nombre: "Papas Lays Clásicas 150g", marca: "Lays", categoria: "snacks", precioCosto: "4.80", precioVenta: "6.40", barcode: "7750213000511", stockSurco: "210", stockSanIsidro: "115" },
  { sku: "LAY-002", nombre: "Papas Lays Limón 40g", marca: "Lays", categoria: "snacks", precioCosto: "1.90", precioVenta: "2.80", barcode: "7750213000528", stockSurco: "260", stockSanIsidro: "140" },
  { sku: "SUB-001", nombre: "Chocolate Sublime Clásico 100g", marca: "Nestlé", categoria: "snacks", precioCosto: "4.10", precioVenta: "5.60", barcode: "7750206000205", stockSurco: "190", stockSanIsidro: "100" },
  { sku: "CAN-001", nombre: "Canchita Rosita Salada 100g", marca: "Rosita", categoria: "snacks", precioCosto: "2.40", precioVenta: "3.50", barcode: "7750369000204", stockSurco: "170", stockSanIsidro: "90" },
  { sku: "TRU-001", nombre: "Gomitas Trululu 90g", marca: "Trululu", categoria: "snacks", precioCosto: "1.80", precioVenta: "2.70", barcode: "7750367000303", stockSurco: "220", stockSanIsidro: "118" },
  { sku: "ORE-001", nombre: "Galletas Oreo 120g", marca: "Oreo", categoria: "snacks", precioCosto: "3.50", precioVenta: "4.80", barcode: "7750343000202", stockSurco: "200", stockSanIsidro: "108" },

  // ── Conservas & Enlatados ──────────────────────────────────────────
  { sku: "ATU-001", nombre: "Filete de Atún Campomar en Aceite 170g", marca: "Campomar", categoria: "conservas", precioCosto: "4.30", precioVenta: "6.10", barcode: "7750143000889", stockSurco: "210", stockSanIsidro: "115" },
  { sku: "ATU-002", nombre: "Atún Florida Entrefina 170g", marca: "Florida", categoria: "conservas", precioCosto: "4.10", precioVenta: "5.80", barcode: "7750131000202", stockSurco: "230", stockSanIsidro: "125" },
  { sku: "ATU-003", nombre: "Atún Florida en Agua 170g", marca: "Florida", categoria: "conservas", precioCosto: "4.20", precioVenta: "5.90", barcode: "7750131000219", stockSurco: "200", stockSanIsidro: "108" },
  { sku: "CHC-001", nombre: "Choclo Entero Florida 430g", marca: "Florida", categoria: "conservas", precioCosto: "3.90", precioVenta: "5.40", barcode: "7750131000315", stockSurco: "140", stockSanIsidro: "75" },
  { sku: "MOL-003", nombre: "Conserva de Tomate Molitalia 1kg", marca: "Molitalia", categoria: "conservas", precioCosto: "4.70", precioVenta: "6.30", barcode: "7750222000525", stockSurco: "160", stockSanIsidro: "85" },
];

// ──────────────────────────────────────────────────────────────────────
// Catálogo de permisos (RBAC) por módulo
// ──────────────────────────────────────────────────────────────────────
const PERMISOS_CATALOG: { codigo: string; descripcion: string; modulo: string }[] = [
  { codigo: "ventas.ver", descripcion: "Ver ventas", modulo: "ventas" },
  { codigo: "ventas.crear", descripcion: "Registrar ventas", modulo: "ventas" },
  { codigo: "ventas.anular", descripcion: "Anular ventas (requiere autorización)", modulo: "ventas" },
  { codigo: "ventas.descuento", descripcion: "Aplicar descuentos manuales", modulo: "ventas" },
  { codigo: "ventas.pagos", descripcion: "Registrar pagos y medios de pago", modulo: "ventas" },
  { codigo: "ventas.reporte", descripcion: "Reportes de ventas", modulo: "ventas" },
  { codigo: "cajas.ver", descripcion: "Ver cajas y terminales", modulo: "cajas" },
  { codigo: "cajas.gestionar", descripcion: "Crear y configurar cajas", modulo: "cajas" },
  { codigo: "caja.abrir_sesion", descripcion: "Abrir sesión de caja", modulo: "cajas" },
  { codigo: "caja.cerrar_sesion", descripcion: "Cerrar sesión propia de caja", modulo: "cajas" },
  { codigo: "caja.cerrar_cualquier_sesion", descripcion: "Forzar cierre de sesiones", modulo: "cajas" },
  { codigo: "caja.registrar_movimiento", descripcion: "Registrar retiros/ingresos de caja", modulo: "cajas" },
  { codigo: "catalogo.ver", descripcion: "Ver catálogo de productos", modulo: "catalogo" },
  { codigo: "catalogo.editar", descripcion: "Crear/editar productos, precios y categorías", modulo: "catalogo" },
  { codigo: "inventario.ver", descripcion: "Ver inventario por sucursal", modulo: "inventario" },
  { codigo: "inventario.ajustar", descripcion: "Ajustar stock y lotes", modulo: "inventario" },
  { codigo: "inventario.registrar_movimiento", descripcion: "Registrar movimientos de inventario", modulo: "inventario" },
  { codigo: "inventario.transferir", descripcion: "Crear transferencias entre sucursales", modulo: "inventario" },
  { codigo: "compras.ver", descripcion: "Ver proveedores y órdenes de compra", modulo: "compras" },
  { codigo: "compras.gestionar", descripcion: "Crear órdenes de compra y recepcionar", modulo: "compras" },
  { codigo: "clientes.ver", descripcion: "Ver clientes", modulo: "clientes" },
  { codigo: "clientes.gestionar", descripcion: "Registrar y editar clientes", modulo: "clientes" },
  { codigo: "clientes.puntos", descripcion: "Administrar programa de puntos", modulo: "clientes" },
  { codigo: "promociones.ver", descripcion: "Ver promociones", modulo: "promociones" },
  { codigo: "promociones.gestionar", descripcion: "Crear y gestionar promociones", modulo: "promociones" },
  { codigo: "reportes.ver", descripcion: "Acceso a reportes gerenciales", modulo: "reportes" },
  { codigo: "reportes.ventas", descripcion: "Reportes de ventas y márgenes", modulo: "reportes" },
  { codigo: "reportes.inventario", descripcion: "Kardex y reportes de inventario", modulo: "reportes" },
  { codigo: "facturacion.ver", descripcion: "Ver comprobantes electrónicos", modulo: "facturacion" },
  { codigo: "facturacion.gestionar", descripcion: "Reintentar envío de comprobantes a SUNAT", modulo: "facturacion" },
  { codigo: "configuracion.ver", descripcion: "Ver configuración del tenant", modulo: "configuracion" },
  { codigo: "configuracion.editar", descripcion: "Editar configuración del tenant", modulo: "configuracion" },
  { codigo: "usuarios.ver", descripcion: "Ver usuarios del tenant", modulo: "usuarios" },
  { codigo: "usuarios.gestionar", descripcion: "Crear/editar usuarios y asignar sucursales", modulo: "usuarios" },
  { codigo: "auditoria.ver", descripcion: "Ver log de auditoría", modulo: "auditoria" },
];

const PERMISOS_BY_ROL: Record<string, string[]> = {
  super_admin: PERMISOS_CATALOG.map((p) => p.codigo),
  admin_tenant: PERMISOS_CATALOG.map((p) => p.codigo),
  admin_sucursal: [
    "ventas.ver", "ventas.crear", "ventas.anular", "ventas.descuento", "ventas.pagos", "ventas.reporte",
    "cajas.ver", "caja.abrir_sesion", "caja.cerrar_sesion", "caja.cerrar_cualquier_sesion", "caja.registrar_movimiento",
    "catalogo.ver", "catalogo.editar",
    "inventario.ver", "inventario.ajustar", "inventario.registrar_movimiento", "inventario.transferir",
    "compras.ver", "compras.gestionar",
    "clientes.ver", "clientes.gestionar", "clientes.puntos",
    "promociones.ver",
    "reportes.ver", "reportes.ventas", "reportes.inventario",
    "facturacion.ver", "facturacion.gestionar",
    "configuracion.ver",
    "usuarios.ver",
    "auditoria.ver",
  ],
  supervisor_caja: [
    "ventas.ver", "ventas.crear", "ventas.anular", "ventas.descuento", "ventas.pagos",
    "cajas.ver", "caja.abrir_sesion", "caja.cerrar_sesion", "caja.registrar_movimiento",
    "catalogo.ver",
    "inventario.ver",
    "clientes.ver", "clientes.gestionar",
    "promociones.ver",
    "reportes.ver",
    "facturacion.ver",
  ],
  cajero: [
    "ventas.ver", "ventas.crear", "ventas.pagos",
    "caja.abrir_sesion",
    "catalogo.ver",
    "inventario.ver",
    "clientes.ver",
    "promociones.ver",
  ],
  almacenero: [
    "catalogo.ver",
    "inventario.ver", "inventario.ajustar", "inventario.registrar_movimiento", "inventario.transferir",
    "compras.ver", "compras.gestionar",
    "reportes.ver", "reportes.inventario",
    "clientes.ver",
  ],
};

// Usuarios demo: el id es fijo y determinista para mantener el seed idempotente.
// Contraseña de desarrollo para todos: Nova123456
const DEMO_USERS = [
  { id: "10000000-0000-4000-8000-000000000001", email: "admin@novamarket.pe", nombre: "Admin General", rol: "admin_tenant", pin: "9999", sucursales: "todas" },
  { id: "10000000-0000-4000-8000-000000000002", email: "carlos.alarcon@novamarket.pe", nombre: "Carlos Alarcón", rol: "cajero", pin: "4821", sucursales: ["Sucursal Central - Surco"] },
  { id: "10000000-0000-4000-8000-000000000003", email: "maria.gomez@novamarket.pe", nombre: "María Gómez", rol: "cajero", pin: "9102", sucursales: ["Sucursal Central - Surco"] },
  { id: "10000000-0000-4000-8000-000000000004", email: "marcos.ramos@novamarket.pe", nombre: "Marcos Ramos", rol: "supervisor_caja", pin: "7741", sucursales: ["Sucursal Central - Surco", "Sucursal San Isidro - Begonias"] },
  { id: "10000000-0000-4000-8000-000000000005", email: "esteban.vega@novamarket.pe", nombre: "Esteban Vega", rol: "almacenero", pin: "3319", sucursales: "todas" },
  { id: "10000000-0000-4000-8000-000000000006", email: "diego.flores@novamarket.pe", nombre: "Diego Flores", rol: "cajero", pin: "6305", sucursales: ["Sucursal San Isidro - Begonias"] },
  { id: "10000000-0000-4000-8000-000000000007", email: "luis.hernandez@novamarket.pe", nombre: "Luis Hernández", rol: "admin_sucursal", pin: "2088", sucursales: ["Sucursal San Isidro - Begonias"] },
  { id: "10000000-0000-4000-8000-000000000008", email: "ana.mendoza@novamarket.pe", nombre: "Ana Mendoza", rol: "cajero", pin: "7184", sucursales: ["Sucursal San Isidro - Begonias"] },
];

// Clientes frecuentes adicionales (se suman a los 4 del seed original).
const RAW_CLIENTS = [
  { tipoDoc: "dni" as const, numDoc: "44127385", nombre: "María Fernández Ríos", telefono: "999334455", email: "maria.fernandez@gmail.com", direccion: "Av. Larco 1120 - Miraflores", puntos: 234 },
  { tipoDoc: "dni" as const, numDoc: "46391127", nombre: "Pedro Quispe Huamán", telefono: "988776655", email: "pedro.q@hotmail.com", direccion: "Av. Aviación 2850 - San Borja", puntos: 92 },
  { tipoDoc: "dni" as const, numDoc: "40218977", nombre: "Luisa Delgado Marín", telefono: "977665544", email: "luisa.delgado@gmail.com", direccion: "Calle Los Nogales 125 - Surco", puntos: 310 },
  { tipoDoc: "dni" as const, numDoc: "47823451", nombre: "Rosa Chávez Benavides", telefono: "966554433", email: "rosa.chavez@outlook.com", direccion: "Av. Conquistadores 220 - San Isidro", puntos: 148 },
  { tipoDoc: "dni" as const, numDoc: "45671290", nombre: "Jorge Salazar Cuba", telefono: "955443322", email: "jorge.salazar@gmail.com", direccion: "Av. Raúl Ferrero 1150 - La Molina", puntos: 176 },
  { tipoDoc: "ruc" as const, numDoc: "20100012456", nombre: "Grupo Alimenta S.A.C.", telefono: "(01) 421-7788", email: "compras@alimenta.pe", direccion: "Av. República de Panamá 3050 - San Isidro", puntos: 890 },
  { tipoDoc: "ruc" as const, numDoc: "20513123344", nombre: "Distribuciones Santa Rosa E.I.R.L.", telefono: "993221100", email: "ventas@distribucionesr.com.pe", direccion: "Jr. Los Olivos 450 - Ate", puntos: 540 },
  { tipoDoc: "ruc" as const, numDoc: "20604455667", nombre: "Restaurante La Huerta S.A.C.", telefono: "(01) 332-9090", email: "gerencia@lahuerta.pe", direccion: "Av. Dos de Mayo 890 - Miraflores", puntos: 720 },
  { tipoDoc: "ce" as const, numDoc: "00144278", nombre: "Chen Wei Li", telefono: "987000111", email: "chen.wei@gmail.com", direccion: "Av. Los Próceres 1400 - Surco", puntos: 65 },
  { tipoDoc: "pasaporte" as const, numDoc: "P45677812", nombre: "Michael Johnson", telefono: "978111222", email: "michael.j@mail.com", direccion: "Av. Javier Prado 500 - San Isidro", puntos: 38 },
];

// ──────────────────────────────────────────────────────────────────────
// Seed principal
// ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Iniciando proceso de Seed para NovaMarket Supermercados POS...");

  const rng = mulberry32(20260816);
  let usuariosCreados = 0;
  let productosCreados = 0;
  let clientesCreados = 0;
  let ventasCreadas = 0;
  let sesionesCreadas = 0;

  try {
    // 1. Plan SaaS
    console.log("  → Creando Plan Enterprise SaaS...");
    const [plan] = await db
      .insert(schema.tenantPlanes)
      .values({
        tipo: "enterprise",
        nombre: "Plan Supermercado Retail Enterprise",
        maxSucursales: 20,
        maxCajas: 100,
        maxUsuarios: 500,
        maxProductos: 50000,
        incluyeFacturacionElectronica: true,
        precioMensual: "299.00",
      })
      .onConflictDoNothing()
      .returning();
    const planId = plan?.id || crypto.randomUUID();

    // 2. Tenant Principal
    console.log("  → Creando Tenant NovaMarket Supermercados S.A.C....");
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
        ruc: "20608912345",
        slug: "novamarket",
        planId,
        estado: "activo",
        colorPrimario: "#2563eb",
      })
      .onConflictDoNothing()
      .returning();

    let tenantId = tenant?.id;
    if (!tenantId) {
      const existing = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, "novamarket")).limit(1);
      tenantId = existing[0]?.id;
    }
    if (!tenantId) throw new Error("No se pudo obtener el tenant");

    // 3. Roles base completos
    console.log("  → Creando Roles de Seguridad...");
    const rolAdminTenant = await getOrCreateRole("admin_tenant", {
      nombre: "Administrador del Tenant",
      slug: "admin_tenant",
      descripcion: "Configura el tenant completo: sucursales, usuarios, precios y reportes",
      esRolBase: true,
    });
    const rolAdminSucursal = await getOrCreateRole("admin_sucursal", {
      nombre: "Administrador de Sucursal",
      slug: "admin_sucursal",
      descripcion: "Gestiona inventario, ventas y usuarios de una sucursal",
      esRolBase: true,
    });
    const rolSupervisor = await getOrCreateRole("supervisor_caja", {
      nombre: "Supervisor de Tienda",
      slug: "supervisor_caja",
      descripcion: "Autorización de cancelaciones, arqueos y notas de crédito",
      esRolBase: true,
    });
    const rolCajero = await getOrCreateRole("cajero", {
      nombre: "Cajero POS",
      slug: "cajero",
      descripcion: "Emisión de comprobantes y cobro en terminal",
      esRolBase: true,
    });
    const rolAlmacenero = await getOrCreateRole("almacenero", {
      nombre: "Encargado de Almacén",
      slug: "almacenero",
      descripcion: "Ingresos de mercadería, ajustes de inventario y transferencias",
      esRolBase: true,
    });
    const rolSuperAdmin = await getOrCreateRole("super_admin", {
      nombre: "Administrador General (Soporte)",
      slug: "super_admin",
      descripcion: "Acceso total a la plataforma SaaS",
      esRolBase: true,
    });

    const rolesBySlug: Record<string, typeof rolCajero> = {
      admin_tenant: rolAdminTenant,
      admin_sucursal: rolAdminSucursal,
      supervisor_caja: rolSupervisor,
      cajero: rolCajero,
      almacenero: rolAlmacenero,
      super_admin: rolSuperAdmin,
    };

    // 4. Catálogo de permisos + asignación RBAC
    console.log("  → Creando catálogo de Permisos y asignación a roles...");
    const permisosByCodigo: Record<string, { id: string }> = {};
    for (const p of PERMISOS_CATALOG) {
      const perm = await getOrCreatePermiso(p.codigo, p.descripcion, p.modulo);
      permisosByCodigo[p.codigo] = perm;
    }

    for (const [slug, codigos] of Object.entries(PERMISOS_BY_ROL)) {
      const rol = rolesBySlug[slug];
      if (!rol) continue;
      const rows = codigos.map((c) => ({
        rolId: rol.id,
        permisoId: permisosByCodigo[c].id,
      }));
      if (rows.length) await db.insert(schema.rolPermisos).values(rows).onConflictDoNothing();
    }

    // 5. Sucursales
    console.log("  → Creando Sucursales...");
    const sucursalSurco = await getOrCreateSucursal(tenantId, "Sucursal Central - Surco", {
      tenantId,
      nombre: "Sucursal Central - Surco",
      direccion: "Av. Javier Prado Este 4200 - Santiago de Surco - Lima",
      ubigeo: "150140",
      telefono: "(01) 619-8000",
      estado: "activa",
      esPrincipal: true,
    });
    const sucursalSanIsidro = await getOrCreateSucursal(tenantId, "Sucursal San Isidro - Begonias", {
      tenantId,
      nombre: "Sucursal San Isidro - Begonias",
      direccion: "Calle Las Begonias 441 - San Isidro - Lima",
      ubigeo: "150131",
      telefono: "(01) 619-8001",
      estado: "activa",
      esPrincipal: false,
    });

    // 6. Cajas físicas
    console.log("  → Creando Cajas y Terminales...");
    const caja1 = await getOrCreateCaja(tenantId, "Caja 01 - Principal", {
      tenantId,
      sucursalId: sucursalSurco.id,
      nombre: "Caja 01 - Principal",
      tipo: "fisica",
      estado: "disponible",
      impresoraId: "PRINTER_IP_192_168_1_150",
    });
    const caja2 = await getOrCreateCaja(tenantId, "Caja 02 - Rápida (Menos de 10 ítems)", {
      tenantId,
      sucursalId: sucursalSurco.id,
      nombre: "Caja 02 - Rápida (Menos de 10 ítems)",
      tipo: "fisica",
      estado: "disponible",
      impresoraId: "PRINTER_IP_192_168_1_151",
    });
    const caja3 = await getOrCreateCaja(tenantId, "Caja 03 - Autoservicio / Self-Checkout", {
      tenantId,
      sucursalId: sucursalSurco.id,
      nombre: "Caja 03 - Autoservicio / Self-Checkout",
      tipo: "autoservicio",
      estado: "disponible",
      impresoraId: "PRINTER_USB_SELFCHECKOUT",
    });
    const caja4 = await getOrCreateCaja(tenantId, "Caja 01 - Principal Begonias", {
      tenantId,
      sucursalId: sucursalSanIsidro.id,
      nombre: "Caja 01 - Principal Begonias",
      tipo: "fisica",
      estado: "disponible",
      impresoraId: "PRINTER_IP_192_168_2_150",
    });
    const caja5 = await getOrCreateCaja(tenantId, "Caja 02 - Rápida Begonias", {
      tenantId,
      sucursalId: sucursalSanIsidro.id,
      nombre: "Caja 02 - Rápida Begonias",
      tipo: "fisica",
      estado: "disponible",
      impresoraId: "PRINTER_IP_192_168_2_151",
    });

    // 7. Usuarios demo (auth.users + usuarios + asignación de sucursales)
    console.log("  → Creando Usuarios demo (auth + perfil + sucursales)...");
    let usersOk = false;
    const usuarioByEmail: Record<string, typeof rolCajero & { id: string }> = {};
    const usuarioByName: Record<string, { id: string }> = {};

    try {
      for (const u of DEMO_USERS) {
        // 1) Crear el usuario real en Supabase Auth (solo si aún no existe).
        await db.execute(sql`
          insert into auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, recovery_token,
            email_change_token_new, email_change
          ) values (
            '00000000-0000-0000-0000-000000000000', ${u.id}, 'authenticated', 'authenticated', ${u.email},
            crypt('Nova123456', gen_salt('bf')),
            now(), '{"provider":"email","providers":["email"]}', '{}',
            now(), now(), '', '', '', ''
          ) on conflict (id) do nothing
        `);

        // 2) Perfil de aplicación (rol, PIN, tenant).
        const rol = rolesBySlug[u.rol];
        await db
          .insert(schema.usuarios)
          .values({
            id: u.id,
            tenantId,
            rolId: rol.id,
            nombre: u.nombre,
            email: u.email,
            pinHash: sql`crypt(${u.pin}, gen_salt('bf'))`,
            activo: true,
          })
          .onConflictDoNothing()
          .returning();

        usuarioByEmail[u.email] = { ...rol, id: u.id };
        usuarioByName[u.nombre] = { id: u.id };
        usuariosCreados++;
      }

      // 3) Asignación de sucursales.
      const todasSucursales = [sucursalSurco, sucursalSanIsidro];
      const asignaciones: typeof schema.usuariosSucursales.$inferInsert[] = [];
      for (const u of DEMO_USERS) {
        if (u.sucursales === "todas") {
          for (const s of todasSucursales) asignaciones.push({ usuarioId: u.id, sucursalId: s.id });
        } else {
          for (const nombre of u.sucursales) {
            const s = todasSucursales.find((x) => x.nombre === nombre);
            if (s) asignaciones.push({ usuarioId: u.id, sucursalId: s.id });
          }
        }
      }
      if (asignaciones.length) await db.insert(schema.usuariosSucursales).values(asignaciones).onConflictDoNothing();

      usersOk = true;
    } catch (err) {
      console.log("  ⚠️ No se pudieron crear los usuarios de Supabase Auth (se omite).", err instanceof Error ? err.message : err);
    }

    const adminUserId = usuarioByEmail["admin@novamarket.pe"]?.id;
    const supervisorUserId = usuarioByEmail["marcos.ramos@novamarket.pe"]?.id;
    const almaceneroUserId = usuarioByEmail["esteban.vega@novamarket.pe"]?.id;

    // 8. Proveedores Mayoristas
    console.log("  → Creando Directorio de Proveedores...");
    const proveedores: Record<string, { id: string }> = {};
    const rawProveedores = [
      { razonSocial: "GLORIA S.A.", ruc: "20100190797", contactoNombre: "Marcos Del Solar", contactoTelefono: "987654321", contactoEmail: "ventas@gloria.com.pe", direccion: "Av. República de Panamá 2461 - Santa Catalina - Lima" },
      { razonSocial: "ALICORP S.A.A.", ruc: "20100055237", contactoNombre: "Patricia Romero", contactoTelefono: "976543210", contactoEmail: "pedidos@alicorp.com.pe", direccion: "Av. Argentina 4793 - Carmen de la Legua - Callao" },
      { razonSocial: "SAN FERNANDO S.A.", ruc: "20100162372", contactoNombre: "Ricardo Núñez", contactoTelefono: "965432109", contactoEmail: "ventas@sanfernando.com.pe", direccion: "Av. Industrial 650 - Santa Anita - Lima" },
      { razonSocial: "LAIVE S.A.", ruc: "20100026095", contactoNombre: "Carla Paredes", contactoTelefono: "954321098", contactoEmail: "comercial@laive.com.pe", direccion: "Av. La Molina 512 - Lima" },
      { razonSocial: "NESTLÉ PERÚ S.A.", ruc: "20100032881", contactoNombre: "José Maldonado", contactoTelefono: "943210987", contactoEmail: "contacto@nestle.com.pe", direccion: "Av. Jorge Chávez 275 - Miraflores - Lima" },
      { razonSocial: "MOLITALIA S.A.", ruc: "20100058637", contactoNombre: "Fernanda Ruiz", contactoTelefono: "932109876", contactoEmail: "pedidos@molitalia.com.pe", direccion: "Av. Argentina 4000 - Callao" },
      { razonSocial: "UNIÓN DE CERVECERÍAS PERUANAS BACKUS", ruc: "20100113662", contactoNombre: "Luis Angulo", contactoTelefono: "921098765", contactoEmail: "clientes@backus.pe", direccion: "Av. Nicolás Arriola 400 - La Victoria - Lima" },
      { razonSocial: "KIMBERLY-CLARK PERÚ S.R.L.", ruc: "20338599274", contactoNombre: "Sofía Campos", contactoTelefono: "910987654", contactoEmail: "ventas@kcc.com", direccion: "Av. Canaval y Moreyra 380 - San Isidro - Lima" },
      { razonSocial: "AJE GROUP S.A.", ruc: "20100132404", contactoNombre: "Miguel Ochoa", contactoTelefono: "909876543", contactoEmail: "corporativo@aje.com.pe", direccion: "Av. Andrés Avelino Cáceres 1000 - Ate - Lima" },
    ];
    for (const p of rawProveedores) {
      const prov = await getOrCreateProveedor(tenantId, p.ruc, { tenantId, ...p });
      proveedores[p.ruc] = prov;
    }

    // 9. Categorías de Supermercado
    console.log("  → Creando Categorías de Productos...");
    const categoriaKeys = {
      lacteos: "Lácteos & Huevos",
      abarrotes: "Abarrotes & Despensa",
      frutas: "Frutas & Verduras (Pesables)",
      limpieza: "Limpieza & Cuidado del Hogar",
      bebidas: "Bebidas & Gaseosas",
      carnes: "Carnes, Pollos & Embutidos",
      panaderia: "Panadería & Repostería",
      congelados: "Congelados & Helados",
      higiene: "Higiene & Cuidado Personal",
      bebes: "Bebés & Maternidad",
      mascotas: "Mascotas & Veterinaria",
      snacks: "Snacks & Confitería",
      conservas: "Conservas & Enlatados",
    };
    const catMap: Record<string, { id: string }> = {};
    for (const [key, nombre] of Object.entries(categoriaKeys)) {
      catMap[key] = await getOrCreateCategoria(tenantId, nombre);
    }

    // 10. Catálogo de Productos (con códigos, inventario en 2 sucursales, lotes y movimientos)
    console.log(`  → Creando Catálogo de Productos (${RAW_PRODUCTS.length} items)...`);
    const ubicacionPorCategoria: Record<string, string> = {
      lacteos: "Refrigeradora A - Estante 2",
      abarrotes: "Pasillo A - Estante 3",
      frutas: "Góndola Frutas - Balanza",
      limpieza: "Pasillo C - Estante 5",
      bebidas: "Góndola Fría - Estante 1",
      carnes: "Cámara Fría - Bandeja 1",
      panaderia: "Panadería - Exhibidor 1",
      congelados: "Cámara Congelados - B1",
      higiene: "Pasillo B - Estante 2",
      bebes: "Pasillo D - Estante 1",
      mascotas: "Pasillo E - Estante 2",
      snacks: "Góndola Snacks - Estante 1",
      conservas: "Pasillo A - Estante 6",
    };

    for (const p of RAW_PRODUCTS) {
      const categoriaId = catMap[p.categoria]?.id;
      const [inserted] = await db
        .insert(schema.productos)
        .values({
          tenantId,
          sku: p.sku,
          nombre: p.nombre,
          categoriaId,
          marca: p.marca,
          unidadMedida: p.unidadMedida || "UND",
          tipo: p.tipo || "unidad",
          precioCosto: p.precioCosto,
          precioVenta: p.precioVenta,
          afectoIgv: true,
          estado: "activo",
        })
        .onConflictDoNothing()
        .returning();

      let prodId = inserted?.id;
      let created = !!inserted;

      if (!prodId) {
        const existing = await db
          .select({ id: schema.productos.id })
          .from(schema.productos)
          .where(and(eq(schema.productos.tenantId, tenantId), eq(schema.productos.sku, p.sku)))
          .limit(1);
        prodId = existing[0]?.id;
      }

      if (!prodId) continue;
      if (created) productosCreados++;

      if (created) {
        await db.insert(schema.productosCodigosBarras).values({ productoId: prodId, codigo: p.barcode, esPrincipal: true }).onConflictDoNothing();
      }

      // Inventario en ambas sucursales
      await db
        .insert(schema.inventario)
        .values({
          productoId: prodId,
          sucursalId: sucursalSurco.id,
          stockActual: p.stockSurco,
          stockMinimo: "20",
          stockMaximo: "1000",
          ubicacionAlmacen: ubicacionPorCategoria[p.categoria] || "Pasillo A - Estante 3",
        })
        .onConflictDoNothing();

      await db
        .insert(schema.inventario)
        .values({
          productoId: prodId,
          sucursalId: sucursalSanIsidro.id,
          stockActual: p.stockSanIsidro,
          stockMinimo: "15",
          stockMaximo: "800",
          ubicacionAlmacen: ubicacionPorCategoria[p.categoria] || "Pasillo A - Estante 3",
        })
        .onConflictDoNothing();

      if (created && p.lote && p.vencimiento) {
        await db.insert(schema.lotes).values({
          productoId: prodId,
          sucursalId: sucursalSurco.id,
          numeroLote: p.lote,
          fechaVencimiento: p.vencimiento,
          cantidadInicial: p.stockSurco,
          cantidadActual: p.stockSurco,
        }).onConflictDoNothing();
      }

      // Movimiento de inventario de ingreso inicial (trazabilidad / kardex)
      if (created && almaceneroUserId) {
        await db.insert(schema.movimientosInventario).values({
          tenantId,
          sucursalId: sucursalSurco.id,
          productoId: prodId,
          tipo: "ingreso",
          cantidad: p.stockSurco,
          motivo: "Carga inicial de catálogo (seed de desarrollo)",
          referenciaTipo: "seed",
          usuarioId: almaceneroUserId,
        }).onConflictDoNothing();
      }
    }

    // Overrides de precio por sucursal (San Isidro cobra ligeramente distinto)
    console.log("  → Aplicando precios por sucursal (San Isidro)...");
    const overrideSkus = ["GLO-001", "COS-001", "PRI-001", "INC-001"];
    const productosPorSku = await db
      .select({ id: schema.productos.id, sku: schema.productos.sku })
      .from(schema.productos)
      .where(and(eq(schema.productos.tenantId, tenantId), inArray(schema.productos.sku, overrideSkus)));
    for (const pr of productosPorSku) {
      const venta = RAW_PRODUCTS.find((p) => p.sku === pr.sku);
      if (!venta) continue;
      const nuevoPrecio = (parseFloat(venta.precioVenta) + 0.3).toFixed(2);
      await db
        .insert(schema.productosPreciosSucursal)
        .values({ productoId: pr.id, sucursalId: sucursalSanIsidro.id, precioVenta: nuevoPrecio })
        .onConflictDoNothing();
    }

    // 11. Combos
    console.log("  → Creando Combos...");
    const existeCombo = await db.select({ id: schema.combos.id }).from(schema.combos).where(eq(schema.combos.tenantId, tenantId)).limit(1);
    if (!existeCombo[0]) {
      const skuToId = new Map(productosPorSku.map((p) => [p.sku, p.id]));
      const allProducts = await db.select({ id: schema.productos.id, sku: schema.productos.sku }).from(schema.productos).where(eq(schema.productos.tenantId, tenantId));
      allProducts.forEach((p) => skuToId.set(p.sku, p.id));

      const combos = [
        {
          nombre: "Combo Desayuno Familiar",
          precioVenta: "24.90",
          items: [
            { sku: "GLO-003", cantidad: "1" },
            { sku: "HUE-001", cantidad: "1" },
            { sku: "BMB-001", cantidad: "1" },
            { sku: "NES-001", cantidad: "1" },
          ],
        },
        {
          nombre: "Combo Limpieza Hogar",
          precioVenta: "19.90",
          items: [
            { sku: "BOL-001", cantidad: "1" },
            { sku: "CLO-001", cantidad: "1" },
            { sku: "PAP-002", cantidad: "1" },
          ],
        },
        {
          nombre: "Combo Snack Cine",
          precioVenta: "15.90",
          items: [
            { sku: "LAY-001", cantidad: "1" },
            { sku: "COC-001", cantidad: "1" },
            { sku: "SUB-001", cantidad: "1" },
          ],
        },
      ];

      for (const combo of combos) {
        const [c] = await db.insert(schema.combos).values({ tenantId, nombre: combo.nombre, precioVenta: combo.precioVenta, estado: "activo" }).returning();
        const detalle = combo.items
          .map((it) => {
            const pid = skuToId.get(it.sku);
            return pid ? { comboId: c!.id, productoId: pid, cantidad: it.cantidad } : null;
          })
          .filter(Boolean) as typeof schema.combosDetalle.$inferInsert[];
        if (detalle.length) await db.insert(schema.combosDetalle).values(detalle).onConflictDoNothing();
      }
    }

    // 12. Promociones
    console.log("  → Creando Promociones...");
    const existePromo = await db.select({ id: schema.promociones.id }).from(schema.promociones).where(eq(schema.promociones.tenantId, tenantId)).limit(1);
    if (!existePromo[0]) {
      const skuToId = new Map<string, string>();
      const allProducts = await db.select({ id: schema.productos.id, sku: schema.productos.sku }).from(schema.productos).where(eq(schema.productos.tenantId, tenantId));
      allProducts.forEach((p) => skuToId.set(p.sku, p.id));

      const promos = [
        { nombre: "Semana de Yogures -20%", tipo: "porcentaje" as const, valor: "20", desde: 3, hasta: 20, skus: ["GLO-002", "LAV-001", "LAV-002"] },
        { nombre: "2x1 Gaseosas 3L", tipo: "2x1" as const, valor: null, desde: 1, hasta: 14, skus: ["INC-001"] },
        { nombre: "Detergente con S/3 de descuento", tipo: "monto_fijo" as const, valor: "3.00", desde: 5, hasta: 30, skus: ["BOL-001", "BOL-002"] },
        { nombre: "Descuento Combo Desayuno S/5", tipo: "combo" as const, valor: "5.00", desde: 2, hasta: 25, skus: ["GLO-003", "HUE-001", "BMB-001", "NES-001"] },
      ];

      for (const promo of promos) {
        const [p] = await db
          .insert(schema.promociones)
          .values({
            tenantId,
            nombre: promo.nombre,
            tipo: promo.tipo,
            valor: promo.valor,
            vigenteDesde: daysAgoDate(promo.desde),
            vigenteHasta: daysAgoDate(-promo.hasta),
            activa: true,
          })
          .returning();

        const links = promo.skus
          .map((s) => {
            const pid = skuToId.get(s);
            return pid ? { promocionId: p!.id, productoId: pid } : null;
          })
          .filter(Boolean) as typeof schema.promocionesProductos.$inferInsert[];
        if (links.length) await db.insert(schema.promocionesProductos).values(links).onConflictDoNothing();
      }
    }

    // 13. Clientes & Programa de Puntos
    console.log("  → Creando Clientes y Programa de Fidelización...");
    const rawClients: {
      tipoDoc: "dni" | "ruc" | "ce" | "pasaporte";
      numDoc: string;
      nombre: string;
      telefono?: string;
      email?: string;
      direccion?: string;
      puntos: number;
    }[] = [
      { tipoDoc: "dni" as const, numDoc: "00000000", nombre: "Clientes Varios / Consumidor Final", puntos: 0 },
      { tipoDoc: "dni" as const, numDoc: "45892144", nombre: "Juan Pérez García", telefono: "987112233", email: "juan.perez@gmail.com", direccion: "Calle Los Cedros 340 - Surco", puntos: 148 },
      { tipoDoc: "ruc" as const, numDoc: "20601234567", nombre: "Inversiones Retail SAC", telefono: "(01) 440-2010", email: "facturas@inversionesretail.pe", direccion: "Av. Rivera Navarrete 501 - San Isidro", puntos: 420 },
      { tipoDoc: "dni" as const, numDoc: "72109845", nombre: "Ana Torres Silva", telefono: "991445566", email: "ana.torres@outlook.com", direccion: "Av. Benavides 1820 - Miraflores", puntos: 86 },
      ...RAW_CLIENTS,
    ];

    const clientesByDoc: Record<string, { id: string; tipoDocumento: string }> = {};
    for (const client of rawClients) {
      const inserted = await getOrCreateCliente(tenantId, client.numDoc, {
        tenantId,
        tipoDocumento: client.tipoDoc,
        numeroDocumento: client.numDoc,
        nombre: client.nombre,
        telefono: client.telefono || undefined,
        email: client.email || undefined,
        direccion: client.direccion || undefined,
      });
      if (inserted.id) {
        clientesByDoc[client.numDoc] = { id: inserted.id, tipoDocumento: inserted.tipoDocumento };
        if (inserted.tipoDocumento === client.tipoDoc && client.puntos > 0) {
          // Solo carga puntos si es un cliente recién creado (o nunca tuvo puntos)
          const puntosExistentes = await db.select().from(schema.programaPuntos).where(eq(schema.programaPuntos.clienteId, inserted.id)).limit(1);
          if (!puntosExistentes[0]) {
            await db.insert(schema.programaPuntos).values({ clienteId: inserted.id, puntosAcumulados: client.puntos }).onConflictDoNothing();
            await db.insert(schema.movimientosPuntos).values({
              clienteId: inserted.id,
              puntos: client.puntos,
              motivo: "Puntos iniciales de carga de catálogo",
            }).onConflictDoNothing();
          }
        }
        clientesCreados++;
      }
    }

    // 14. Órdenes de Compra (requieren usuarios)
    if (usersOk) {
      console.log("  → Creando Órdenes de Compra...");
      const existeOC = await db.select({ id: schema.ordenesCompra.id }).from(schema.ordenesCompra).where(eq(schema.ordenesCompra.tenantId, tenantId)).limit(1);
      if (!existeOC[0]) {
        const skuToId = new Map<string, string>();
        const allProducts = await db.select({ id: schema.productos.id, sku: schema.productos.sku }).from(schema.productos).where(eq(schema.productos.tenantId, tenantId));
        allProducts.forEach((p) => skuToId.set(p.sku, p.id));

        const ocs = [
          {
            numero: "OC-2026-0001",
            proveedorRuc: "20100190797",
            sucursal: sucursalSurco,
            estado: "recibida_completa" as const,
            fechaEmision: daysAgoDate(12),
            fechaEntregaEstimada: daysAgoDate(8),
            observaciones: "Reabastecimiento quincenal de lácteos",
            creadoPor: almaceneroUserId!,
            items: [
              { sku: "GLO-001", cantidad: "240", costo: "3.20" },
              { sku: "GLO-003", cantidad: "120", costo: "4.10" },
              { sku: "LAV-001", cantidad: "80", costo: "5.60" },
            ],
          },
          {
            numero: "OC-2026-0002",
            proveedorRuc: "20100162372",
            sucursal: sucursalSurco,
            estado: "recibida_parcial" as const,
            fechaEmision: daysAgoDate(6),
            fechaEntregaEstimada: daysAgoDate(-1),
            observaciones: "Carnes: llegó solo la mitad por flete",
            creadoPor: almaceneroUserId!,
            items: [
              { sku: "SNF-001", cantidad: "100", costo: "10.80" },
              { sku: "SNF-003", cantidad: "150", costo: "5.20" },
            ],
          },
          {
            numero: "OC-2026-0003",
            proveedorRuc: "20100055237",
            sucursal: sucursalSanIsidro,
            estado: "aprobada" as const,
            fechaEmision: daysAgoDate(3),
            fechaEntregaEstimada: daysAgoDate(2),
            observaciones: "Abarrotes para la sucursal Begonias",
            creadoPor: almaceneroUserId!,
            items: [
              { sku: "PRI-001", cantidad: "90", costo: "7.50" },
              { sku: "DON-001", cantidad: "160", costo: "3.10" },
            ],
          },
          {
            numero: "OC-2026-0004",
            proveedorRuc: "20100113662",
            sucursal: sucursalSanIsidro,
            estado: "pendiente" as const,
            fechaEmision: daysAgoDate(1),
            fechaEntregaEstimada: daysAgoDate(-4),
            observaciones: "Promoción de gaseosas para el fin de semana",
            creadoPor: almaceneroUserId!,
            items: [
              { sku: "INC-001", cantidad: "120", costo: "8.10" },
              { sku: "COC-001", cantidad: "100", costo: "7.60" },
            ],
          },
        ];

        for (const oc of ocs) {
          const proveedor = proveedores[oc.proveedorRuc];
          if (!proveedor) continue;
          const [insertedOC] = await db
            .insert(schema.ordenesCompra)
            .values({
              tenantId,
              sucursalId: oc.sucursal.id,
              proveedorId: proveedor.id,
              estado: oc.estado,
              numero: oc.numero,
              fechaEmision: oc.fechaEmision,
              fechaEntregaEstimada: oc.fechaEntregaEstimada,
              observaciones: oc.observaciones,
              creadoPor: oc.creadoPor,
            })
            .returning();

          const detalle = oc.items
            .map((it) => {
              const pid = skuToId.get(it.sku);
              return pid ? { ordenCompraId: insertedOC!.id, productoId: pid, cantidadPedida: it.cantidad, cantidadRecibida: oc.estado === "pendiente" ? "0" : oc.estado === "recibida_completa" ? it.cantidad : (parseFloat(it.cantidad) / 2).toFixed(0), precioUnitarioCosto: it.costo } : null;
            })
            .filter(Boolean) as typeof schema.ordenesCompraDetalle.$inferInsert[];
          if (detalle.length) await db.insert(schema.ordenesCompraDetalle).values(detalle).onConflictDoNothing();

          // Recepción de mercadería para la OC recibida completa.
          if (oc.estado === "recibida_completa") {
            const [recepcion] = await db.insert(schema.recepcionesMercaderia).values({
              ordenCompraId: insertedOC!.id,
              numeroGuiaRemision: "GR-2026-001234",
              recibidoPor: almaceneroUserId!,
              observaciones: "Recepción conforme",
            }).returning();
            const recepcionDetalle = oc.items
              .map((it) => {
                const pid = skuToId.get(it.sku);
                return pid ? { recepcionId: recepcion!.id, productoId: pid, cantidadRecibida: it.cantidad } : null;
              })
              .filter(Boolean) as typeof schema.recepcionesMercaderiaDetalle.$inferInsert[];
            if (recepcionDetalle.length) await db.insert(schema.recepcionesMercaderiaDetalle).values(recepcionDetalle).onConflictDoNothing();
          }
        }
      }
    }

    // 15. Ventas históricas + sesiones de caja (requieren usuarios)
    if (usersOk) {
      console.log("  → Generando ventas históricas y sesiones de caja (7 días)...");
      const existeVenta = await db.select({ id: schema.ventas.id }).from(schema.ventas).where(eq(schema.ventas.tenantId, tenantId)).limit(1);
      if (!existeVenta[0]) {
        const allProducts = await db.select({
          id: schema.productos.id,
          sku: schema.productos.sku,
          precioVenta: schema.productos.precioVenta,
          tipo: schema.productos.tipo,
        }).from(schema.productos).where(eq(schema.productos.tenantId, tenantId));

        const clientList = Object.values(clientesByDoc).filter((c) => c.tipoDocumento !== "dni" || c.id !== clientesByDoc["00000000"].id);

        const cajeroPorCaja: { caja: typeof caja1; sucursal: typeof sucursalSurco; cajeroId: string; serieBoleta: string; serieFactura: string }[] = [
          { caja: caja1, sucursal: sucursalSurco, cajeroId: usuarioByName["Carlos Alarcón"].id, serieBoleta: "B001", serieFactura: "F001" },
          { caja: caja2, sucursal: sucursalSurco, cajeroId: usuarioByName["María Gómez"].id, serieBoleta: "B002", serieFactura: "F002" },
          { caja: caja3, sucursal: sucursalSurco, cajeroId: usuarioByName["Carlos Alarcón"].id, serieBoleta: "B003", serieFactura: "F003" },
          { caja: caja4, sucursal: sucursalSanIsidro, cajeroId: usuarioByName["Diego Flores"].id, serieBoleta: "B101", serieFactura: "F101" },
          { caja: caja5, sucursal: sucursalSanIsidro, cajeroId: usuarioByName["Ana Mendoza"].id, serieBoleta: "B102", serieFactura: "F102" },
        ];

        const series: Record<string, { boleta: number; factura: number }> = {};
        const serieKey = (cajaNombre: string) => cajaNombre.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();

        let anulacionesPendientes = 2; // anulamos 2 ventas de días pasados para probar el flujo

        for (const plan of cajeroPorCaja) {
          const key = serieKey(plan.caja.nombre);
          series[key] = { boleta: 1, factura: 1 };

          for (let dia = 0; dia < 7; dia++) {
            const apertura = pick(rng, ["500.00", "800.00", "400.00", "650.00"]);
            const esHoy = dia === 0;
            const horaApertura = 8 + Math.floor(rng() * 2);
            const minutoApertura = Math.floor(rng() * 60);

            const [sesion] = await db
              .insert(schema.sesionesCaja)
              .values({
                cajaId: plan.caja.id,
                cajeroId: plan.cajeroId,
                montoApertura: apertura,
                fechaApertura: daysAgoTs(dia, horaApertura, minutoApertura),
                estado: esHoy ? "abierta" : "cerrada",
              } as any)
              .returning();
            sesionesCreadas++;

            const numVentas = plan.caja.tipo === "autoservicio" ? 3 + Math.floor(rng() * 3) : 4 + Math.floor(rng() * 5);
            let efectivoTotal = 0;
            const horaCierre = 20 + Math.floor(rng() * 2);
            const retiro = rng() < 0.35 ? pick(rng, ["200.00", "300.00", "150.00"]) : null;

            for (let v = 0; v < numVentas; v++) {
              const horaVenta = horaApertura + 1 + Math.floor(rng() * (horaCierre - horaApertura - 2));
              const minutoVenta = Math.floor(rng() * 60);
              const creadoEn = daysAgoTs(dia, horaVenta, minutoVenta, Math.floor(rng() * 60));

              const numItems = 1 + Math.floor(rng() * 6);
              const items = shuffle(rng, allProducts).slice(0, numItems).map((p) => ({
                productoId: p.id,
                sku: p.sku,
                precioVenta: p.precioVenta,
                tipo: p.tipo,
                cantidad: p.tipo === "peso" ? r2(Math.round((0.5 + rng() * 2) * 100) / 100) : String(1 + Math.floor(rng() * 3)),
              }));

              let subtotal = 0;
              const detalleRows: any[] = [];
              for (const it of items) {
                const lineSubtotal = parseFloat(it.precioVenta) * parseFloat(it.cantidad);
                subtotal += lineSubtotal;
                detalleRows.push({
                  productoId: it.productoId,
                  cantidad: it.cantidad,
                  precioUnitario: it.precioVenta,
                  descuento: "0",
                  subtotal: r2(lineSubtotal),
                });
              }
              subtotal = Math.round(subtotal * 100) / 100;

              const conDescuento = rng() < 0.06;
              const descuento = conDescuento ? r2(Math.round(subtotal * (0.03 + rng() * 0.07) * 100) / 100) : "0";
              const base = subtotal - parseFloat(descuento);
              const igv = r2(Math.round(base * 0.18 * 100) / 100);
              const total = r2(base + parseFloat(igv));

              const anular = !esHoy && anulacionesPendientes > 0 && v === 0;
              if (anular) anulacionesPendientes--;

              const cliente = rng() < 0.3 ? pick(rng, clientList) : null;
              const estado = anular ? "anulada" : "completada";

              const [venta] = await db
                .insert(schema.ventas)
                .values({
                  tenantId,
                  sucursalId: plan.sucursal.id,
                  cajaId: plan.caja.id,
                  sesionCajaId: sesion!.id,
                  cajeroId: plan.cajeroId,
                  clienteId: cliente?.id || null,
                  subtotal: r2(subtotal),
                  descuento,
                  igv,
                  total,
                  estado,
                  creadoEn,
                } as any)
                .returning();
              ventasCreadas++;

              await db.insert(schema.ventasDetalle).values(
                detalleRows.map((d) => ({ ...d, ventaId: venta!.id })),
              ).onConflictDoNothing();

              // Movimientos de inventario de salida por venta (kardex)
              if (!anular && almaceneroUserId) {
                const invMoves = items.map((it) => ({
                  tenantId,
                  sucursalId: plan.sucursal.id,
                  productoId: it.productoId,
                  tipo: "salida" as const,
                  cantidad: it.cantidad,
                  motivo: "Venta en caja",
                  referenciaTipo: "venta",
                  referenciaId: venta!.id,
                  usuarioId: plan.cajeroId,
                }));
                await db.insert(schema.movimientosInventario).values(invMoves).onConflictDoNothing();
              }

              // Pagos (efectivo / tarjeta / yape / plin / mixto)
              const tipoPago = rng();
              const pagos: { ventaId: string; medioPago: typeof schema.ventasPagos.$inferInsert.medioPago; monto: string; referencia?: string }[] = [];
              let efectivoPagado = 0;

              if (tipoPago < 0.62) {
                pagos.push({ ventaId: venta!.id, medioPago: "efectivo", monto: total });
                efectivoPagado = parseFloat(total);
              } else if (tipoPago < 0.76) {
                pagos.push({ ventaId: venta!.id, medioPago: "tarjeta", monto: total, referencia: "****" + String(1000 + Math.floor(rng() * 9000)) });
              } else if (tipoPago < 0.88) {
                pagos.push({ ventaId: venta!.id, medioPago: "yape", monto: total, referencia: String(900000000 + Math.floor(rng() * 99999999)) });
              } else if (tipoPago < 0.96) {
                pagos.push({ ventaId: venta!.id, medioPago: "plin", monto: total, referencia: String(900000000 + Math.floor(rng() * 99999999)) });
              } else {
                const mitad = r2(Math.round((parseFloat(total) / 2) * 100) / 100);
                pagos.push({ ventaId: venta!.id, medioPago: "efectivo", monto: mitad });
                pagos.push({ ventaId: venta!.id, medioPago: "tarjeta", monto: r2(parseFloat(total) - parseFloat(mitad)), referencia: "****" + String(1000 + Math.floor(rng() * 9000)) });
                efectivoPagado = parseFloat(mitad);
              }
              efectivoTotal += efectivoPagado;

              await db.insert(schema.ventasPagos).values(pagos.map((p) => ({ ...p }))).onConflictDoNothing();

              // Movimiento de caja espejo por venta en efectivo
              if (efectivoPagado > 0) {
                await db.insert(schema.movimientosCaja).values({
                  sesionCajaId: sesion!.id,
                  tipo: "venta",
                  monto: r2(efectivoPagado),
                  ventaId: venta!.id,
                  usuarioId: plan.cajeroId,
                } as any).onConflictDoNothing();
              }

              // Anulación
              if (anular && supervisorUserId) {
                await db.insert(schema.anulaciones).values({
                  ventaId: venta!.id,
                  motivo: "Error de cobro / producto dañado al momento de la venta",
                  autorizadoPor: supervisorUserId,
                  creadoEn,
                } as any).onConflictDoNothing();
              }

              // Comprobante (boleta / factura), salvo ventas anuladas
              if (!anular) {
                const esFactura = cliente?.tipoDocumento === "ruc";
                const numero = String(series[serieKey(plan.caja.nombre)][esFactura ? "factura" : "boleta"]).padStart(8, "0");
                if (esFactura) series[serieKey(plan.caja.nombre)].factura++;
                else series[serieKey(plan.caja.nombre)].boleta++;

                const estadoSunat: "enviado" | "pendiente" | "aceptado" = esHoy ? (rng() < 0.5 ? "enviado" : "pendiente") : "aceptado";
                await db.insert(schema.comprobantes).values({
                  ventaId: venta!.id,
                  tipo: esFactura ? "factura" : "boleta",
                  serie: esFactura ? plan.serieFactura : plan.serieBoleta,
                  numero,
                  estadoSunat,
                  enviadoEn: esHoy ? creadoEn : null,
                } as any).onConflictDoNothing();
              }
            }

            // Cierre de sesión de días pasados
            if (!esHoy) {
              const montoCierreSistema = r2(parseFloat(apertura) + efectivoTotal - (retiro ? parseFloat(retiro) : 0));
              await db.update(schema.sesionesCaja)
                .set({
                  fechaCierre: daysAgoTs(dia, horaCierre, Math.floor(rng() * 40)),
                  montoCierreSistema,
                  montoCierreDeclarado: montoCierreSistema,
                  diferencia: "0",
                  estado: "cerrada",
                } as any)
                .where(eq(schema.sesionesCaja.id, sesion!.id));

              if (retiro) {
                await db.insert(schema.movimientosCaja).values({
                  sesionCajaId: sesion!.id,
                  tipo: "egreso",
                  monto: retiro,
                  motivo: "Retiro parcial de efectivo a administración",
                  usuarioId: plan.cajeroId,
                } as any).onConflictDoNothing();
              }
            }
          }
        }
      }
    }

    // 16. Transferencia de stock entre sucursales (requiere usuarios)
    if (usersOk) {
      console.log("  → Creando transferencia de stock Surco → San Isidro...");
      const existeTransferencia = await db.select({ id: schema.transferenciasStock.id }).from(schema.transferenciasStock).where(eq(schema.transferenciasStock.tenantId, tenantId)).limit(1);
      if (!existeTransferencia[0]) {
        const skuToId = new Map<string, string>();
        const allProducts = await db.select({ id: schema.productos.id, sku: schema.productos.sku }).from(schema.productos).where(eq(schema.productos.tenantId, tenantId));
        allProducts.forEach((p) => skuToId.set(p.sku, p.id));

        const [transferencia] = await db.insert(schema.transferenciasStock).values({
          tenantId,
          sucursalOrigenId: sucursalSurco.id,
          sucursalDestinoId: sucursalSanIsidro.id,
          estado: "recibida",
          solicitadoPor: almaceneroUserId!,
          recibidoPor: usuarioByName["Luis Hernández"].id,
          creadoEn: daysAgoTs(5, 10, 0),
          recibidoEn: daysAgoTs(4, 9, 30),
        } as any).returning();

        const detalle = [
          { sku: "COS-001", cantidad: "50" },
          { sku: "PRI-001", cantidad: "20" },
          { sku: "PAP-001", cantidad: "30" },
        ].map((it) => {
          const pid = skuToId.get(it.sku);
          return pid ? { transferenciaId: transferencia!.id, productoId: pid, cantidad: it.cantidad } : null;
        }).filter(Boolean) as typeof schema.transferenciasStockDetalle.$inferInsert[];

        if (detalle.length) await db.insert(schema.transferenciasStockDetalle).values(detalle).onConflictDoNothing();
      }
    }

    // 17. Log de auditoría (requiere usuarios)
    if (usersOk) {
      console.log("  → Registrando entradas de Auditoría...");
      const existeAuditoria = await db.select({ id: schema.auditoriaLog.id }).from(schema.auditoriaLog).where(eq(schema.auditoriaLog.tenantId, tenantId)).limit(1);
      if (!existeAuditoria[0]) {
        const auditoriaRows = [
          { tabla: "cajas", accion: "crear" as const, datos: { cajas: 5 } },
          { tabla: "productos", accion: "crear" as const, datos: { productos: RAW_PRODUCTS.length } },
          { tabla: "usuarios", accion: "crear" as const, datos: { usuarios: DEMO_USERS.length } },
          { tabla: "ordenes_compra", accion: "crear" as const, datos: { ordenes: 4 } },
          { tabla: "inventario", accion: "actualizar" as const, datos: { motivo: "Carga inicial de stock" } },
        ];
        const usuarioAuditor = adminUserId || almaceneroUserId || usuarioByName["Admin General"].id;
        for (const row of auditoriaRows) {
          await db.insert(schema.auditoriaLog).values({
            tenantId,
            usuarioId: usuarioAuditor,
            tablaAfectada: row.tabla,
            registroId: crypto.randomUUID(),
            accion: row.accion,
            datosNuevos: row.datos,
            ipOrigen: "127.0.0.1",
          }).onConflictDoNothing();
        }
      }
    }

    // ── Resumen final ─────────────────────────────────────────────────
    console.log("=================================================================");
    console.log("✅ ¡SEED COMPLETADO EXITOSAMENTE!");
    console.log("   • Tenant: NovaMarket Supermercados S.A.C. (RUC 20608912345)");
    console.log("   • Sucursales: Surco (Principal) y San Isidro, 5 cajas configuradas");
    console.log(`   • Roles: 6 roles base + ${PERMISOS_CATALOG.length} permisos asignados`);
    console.log(`   • Usuarios demo: ${usuariosCreados} (contraseña: Nova123456)`);
    console.log(`   • Proveedores: ${Object.keys(proveedores).length} mayoristas`);
    console.log(`   • Categorías: ${Object.keys(catMap).length}`);
    console.log(`   • Productos: ${RAW_PRODUCTS.length} (nuevos: ${productosCreados}) con EAN-13, lotes y stock en 2 sucursales`);
    console.log("   • Combos: 3 | Promociones: 4 | Órdenes de compra: 4");
    console.log(`   • Clientes: ${rawClients.length} con saldos de puntos`);
    if (usersOk) {
      console.log(`   • Sesiones de caja: ${sesionesCreadas} (7 días) | Ventas: ${ventasCreadas} (con comprobantes, pagos y kardex)`);
      console.log("   • 1 transferencia Surco → San Isidro + log de auditoría");
    } else {
      console.log("   • ⚠️ Sin usuarios: se omitieron ventas, órdenes, transferencias y auditoría");
    }
    console.log("=================================================================");
  } catch (err) {
    console.error("❌ Error durante la ejecución del seed:", err);
  } finally {
    await client.end();
  }
}

seed();
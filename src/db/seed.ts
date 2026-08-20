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

// ──────────────────────────────────────────────────────────────────────
// Catálogo de Productos
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

  // ── Frutas & Verduras (Pesables) ───────────────────────────────────
  { sku: "FRU-001", nombre: "Manzana Delicia Nacional", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "2.80", precioVenta: "4.80", barcode: "2000001004801", stockSurco: "85.5", stockSanIsidro: "45.0", lote: "L-2026-086", vencimiento: "2026-08-22" },
  { sku: "FRU-002", nombre: "Plátano Seda", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "1.80", precioVenta: "3.20", barcode: "2000002003205", stockSurco: "120.0", stockSanIsidro: "60.0", lote: "L-2026-087", vencimiento: "2026-08-20" },
  { sku: "FRU-003", nombre: "Papa Amarilla", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "1.50", precioVenta: "2.80", barcode: "2000003003403", stockSurco: "150.0", stockSanIsidro: "80.0", lote: "L-2026-085", vencimiento: "2026-08-25" },
  { sku: "FRU-004", nombre: "Cebolla Roja", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "1.40", precioVenta: "2.60", barcode: "2000004003600", stockSurco: "100.0", stockSanIsidro: "55.0", lote: "L-2026-086", vencimiento: "2026-08-26" },
  { sku: "FRU-005", nombre: "Tomate Italiano", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "2.20", precioVenta: "4.00", barcode: "2000005003808", stockSurco: "90.0", stockSanIsidro: "48.0", lote: "L-2026-086", vencimiento: "2026-08-24" },
  { sku: "FRU-006", nombre: "Limón Sutil", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "3.00", precioVenta: "5.50", barcode: "2000006003905", stockSurco: "70.0", stockSanIsidro: "40.0", lote: "L-2026-087", vencimiento: "2026-08-21" },
  { sku: "FRU-007", nombre: "Palta Hass", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "4.50", precioVenta: "7.90", barcode: "2000007004001", stockSurco: "55.0", stockSanIsidro: "30.0", lote: "L-2026-086", vencimiento: "2026-08-23" },
  { sku: "FRU-008", nombre: "Zanahoria", marca: "Campo Fresco", categoria: "frutas", unidadMedida: "KG", tipo: "peso", precioCosto: "1.30", precioVenta: "2.40", barcode: "2000008004108", stockSurco: "110.0", stockSanIsidro: "60.0", lote: "L-2026-087", vencimiento: "2026-08-27" },

  // ── Carnes & Embutidos ─────────────────────────────────────────────
  { sku: "SNF-001", nombre: "Pechuga de Pollo San Fernando 1kg", marca: "San Fernando", categoria: "carnes", unidadMedida: "KG", precioCosto: "10.80", precioVenta: "14.50", barcode: "7750097000315", stockSurco: "60.0", stockSanIsidro: "32.0", lote: "L-2026-089", vencimiento: "2026-08-24" },
  { sku: "SNF-002", nombre: "Bistec de Res 1kg", marca: "San Fernando", categoria: "carnes", unidadMedida: "KG", precioCosto: "15.50", precioVenta: "19.90", barcode: "7750097000322", stockSurco: "45.0", stockSanIsidro: "24.0", lote: "L-2026-089", vencimiento: "2026-08-23" },
  { sku: "SNF-003", nombre: "Salchicha Hot Dog San Fernando 300g", marca: "San Fernando", categoria: "carnes", precioCosto: "5.20", precioVenta: "7.10", barcode: "7750097000339", stockSurco: "170", stockSanIsidro: "90", lote: "L-2026-088", vencimiento: "2026-09-10" },

  // ── Limpieza ───────────────────────────────────────────────────────
  { sku: "BOL-001", nombre: "Detergente Bolívar Floral 1kg", marca: "Bolívar", categoria: "limpieza", precioCosto: "6.20", precioVenta: "8.50", barcode: "7750124001923", stockSurco: "180", stockSanIsidro: "95" },
  { sku: "BOL-002", nombre: "Detergente Bolívar Triple Acción 2kg", marca: "Bolívar", categoria: "limpieza", precioCosto: "11.30", precioVenta: "14.90", barcode: "7750124001930", stockSurco: "120", stockSanIsidro: "65" },
  { sku: "CLO-001", nombre: "Clorox Ropa Blanca 3.7L", marca: "Clorox", categoria: "limpieza", precioCosto: "8.10", precioVenta: "10.50", barcode: "7750203000118", stockSurco: "90", stockSanIsidro: "48" },
  { sku: "PAP-001", nombre: "Papel Higiénico Suave Elite 4 x 25m", marca: "Elite", categoria: "limpieza", precioCosto: "5.60", precioVenta: "7.40", barcode: "7750085000423", stockSurco: "320", stockSanIsidro: "170" },

  // ── Bebidas & Gaseosas ─────────────────────────────────────────────
  { sku: "INC-001", nombre: "Gaseosa Inca Kola 3L", marca: "Inca Kola", categoria: "bebidas", precioCosto: "8.10", precioVenta: "10.90", barcode: "7750051000291", stockSurco: "220", stockSanIsidro: "120" },
  { sku: "COC-001", nombre: "Gaseosa Coca-Cola 2.25L", marca: "Coca-Cola", categoria: "bebidas", precioCosto: "7.60", precioVenta: "10.20", barcode: "7750142000290", stockSurco: "240", stockSanIsidro: "130" },
  { sku: "SLU-001", nombre: "Agua San Luis 2.5L", marca: "San Luis", categoria: "bebidas", precioCosto: "3.40", precioVenta: "4.60", barcode: "7750320000286", stockSurco: "260", stockSanIsidro: "140" },
  { sku: "CRI-001", nombre: "Cerveza Cristal 620ml (Pack x 6)", marca: "Cristal", categoria: "bebidas", precioCosto: "16.90", precioVenta: "21.90", barcode: "7750221000301", stockSurco: "90", stockSanIsidro: "48" },

  // ── Snacks ─────────────────────────────────────────────────────────
  { sku: "LAY-001", nombre: "Papas Lays Clásicas 150g", marca: "Lays", categoria: "snacks", precioCosto: "4.80", precioVenta: "6.40", barcode: "7750213000511", stockSurco: "210", stockSanIsidro: "115" },
  { sku: "SUB-001", nombre: "Chocolate Sublime Clásico 100g", marca: "Nestlé", categoria: "snacks", precioCosto: "4.10", precioVenta: "5.60", barcode: "7750206000205", stockSurco: "190", stockSanIsidro: "100" },
  { sku: "ORE-001", nombre: "Galletas Oreo 120g", marca: "Oreo", categoria: "snacks", precioCosto: "3.50", precioVenta: "4.80", barcode: "7750343000202", stockSurco: "200", stockSanIsidro: "108" },
];

const PERMISOS_CATALOG = [
  { codigo: "ventas.ver", descripcion: "Ver ventas", modulo: "ventas" },
  { codigo: "ventas.crear", descripcion: "Registrar ventas", modulo: "ventas" },
  { codigo: "ventas.anular", descripcion: "Anular ventas (requiere autorización)", modulo: "ventas" },
  { codigo: "ventas.descuento", descripcion: "Aplicar descuentos manuales", modulo: "ventas" },
  { codigo: "ventas.pagos", descripcion: "Registrar pagos y medios de pago", modulo: "ventas" },
  { codigo: "cajas.ver", descripcion: "Ver cajas y terminales", modulo: "cajas" },
  { codigo: "catalogo.ver", descripcion: "Ver catálogo de productos", modulo: "catalogo" },
  { codigo: "inventario.ver", descripcion: "Ver inventario por sucursal", modulo: "inventario" },
  { codigo: "compras.ver", descripcion: "Ver proveedores y órdenes de compra", modulo: "compras" },
  { codigo: "clientes.ver", descripcion: "Ver clientes", modulo: "clientes" },
];

const DEMO_USERS = [
  { id: "10000000-0000-4000-8000-000000000001", email: "admin@novamarket.pe", nombre: "Admin General", rol: "admin_tenant", pin: "9999" },
  { id: "10000000-0000-4000-8000-000000000002", email: "carlos.alarcon@novamarket.pe", nombre: "Carlos Alarcón", rol: "cajero", pin: "4821" },
  { id: "10000000-0000-4000-8000-000000000003", email: "maria.gomez@novamarket.pe", nombre: "María Gómez", rol: "cajero", pin: "9102" },
  { id: "10000000-0000-4000-8000-000000000004", email: "marcos.ramos@novamarket.pe", nombre: "Marcos Ramos", rol: "supervisor_caja", pin: "7741" },
  { id: "10000000-0000-4000-8000-000000000005", email: "esteban.vega@novamarket.pe", nombre: "Esteban Vega", rol: "almacenero", pin: "3319" },
  { id: "10000000-0000-4000-8000-000000000006", email: "diego.flores@novamarket.pe", nombre: "Diego Flores", rol: "cajero", pin: "6305" },
];

const RAW_CLIENTS = [
  { tipoDoc: "dni" as const, numDoc: "00000000", nombre: "Clientes Varios / Consumidor Final", puntos: 0 },
  { tipoDoc: "dni" as const, numDoc: "45892144", nombre: "Juan Pérez García", telefono: "987112233", email: "juan.perez@gmail.com", direccion: "Calle Los Cedros 340 - Surco", puntos: 148 },
  { tipoDoc: "ruc" as const, numDoc: "20601234567", nombre: "Inversiones Retail SAC", telefono: "(01) 440-2010", email: "facturas@inversionesretail.pe", direccion: "Av. Rivera Navarrete 501 - San Isidro", puntos: 420 },
  { tipoDoc: "dni" as const, numDoc: "72109845", nombre: "Ana Torres Silva", telefono: "991445566", email: "ana.torres@outlook.com", direccion: "Av. Benavides 1820 - Miraflores", puntos: 86 },
  { tipoDoc: "dni" as const, numDoc: "44127385", nombre: "María Fernández Ríos", telefono: "999334455", email: "maria.fernandez@gmail.com", direccion: "Av. Larco 1120 - Miraflores", puntos: 234 },
  { tipoDoc: "dni" as const, numDoc: "46391127", nombre: "Pedro Quispe Huamán", telefono: "988776655", email: "pedro.q@hotmail.com", direccion: "Av. Aviación 2850 - San Borja", puntos: 92 },
  { tipoDoc: "ruc" as const, numDoc: "20100012456", nombre: "Grupo Alimenta S.A.C.", telefono: "(01) 421-7788", email: "compras@alimenta.pe", direccion: "Av. República de Panamá 3050 - San Isidro", puntos: 890 },
];

async function seed() {
  console.log("🌱 [1/10] Conectando a Supabase PostgreSQL y preparando datos...");
  const rng = mulberry32(20260816);

  try {
    // 1. Plan SaaS
    console.log("  → [2/10] Configurando Plan Enterprise y Tenant Principal...");
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

    const planId = plan?.id || (await db.select({ id: schema.tenantPlanes.id }).from(schema.tenantPlanes).limit(1))[0]?.id;

    // 2. Tenant Principal
    const [insertedTenant] = await db
      .insert(schema.tenants)
      .values({
        planId,
        razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
        ruc: "20608912345",
        slug: "novamarket",
        estado: "activo",
      })
      .onConflictDoNothing()
      .returning();

    const tenantId = insertedTenant?.id || (await db.select({ id: schema.tenants.id }).from(schema.tenants).limit(1))[0].id;

    // 3. Roles
    console.log("  → [3/10] Creando Roles de Seguridad RBAC...");
    const rolesList = [
      { slug: "admin_tenant", nombre: "Administrador del Tenant", descripcion: "Configura tenant completo", esRolBase: true },
      { slug: "admin_sucursal", nombre: "Administrador de Sucursal", descripcion: "Gestiona sucursal", esRolBase: true },
      { slug: "supervisor_caja", nombre: "Supervisor de Tienda", descripcion: "Autoriza cancelaciones y arqueos", esRolBase: true },
      { slug: "cajero", nombre: "Cajero POS", descripcion: "Emisión de comprobantes y cobro", esRolBase: true },
      { slug: "almacenero", nombre: "Encargado de Almacén", descripcion: "Ingresos y kardex", esRolBase: true },
      { slug: "super_admin", nombre: "Administrador General", descripcion: "Acceso total", esRolBase: true },
    ];
    await db.insert(schema.roles).values(rolesList).onConflictDoNothing();
    const allRoles = await db.select().from(schema.roles);
    const rolesBySlug = new Map(allRoles.map((r) => [r.slug, r.id]));

    // 4. Sucursales & Cajas
    console.log("  → [4/10] Creando Sucursales y Cajas POS...");
    await db
      .insert(schema.sucursales)
      .values([
        {
          tenantId,
          nombre: "Sucursal Central - Surco",
          direccion: "Av. Javier Prado Este 4200 - Santiago de Surco - Lima",
          ubigeo: "150140",
          telefono: "(01) 619-8000",
          estado: "activa",
          esPrincipal: true,
        },
        {
          tenantId,
          nombre: "Sucursal San Isidro - Begonias",
          direccion: "Calle Las Begonias 441 - San Isidro - Lima",
          ubigeo: "150131",
          telefono: "(01) 619-8001",
          estado: "activa",
          esPrincipal: false,
        },
      ])
      .onConflictDoNothing();

    const allSucursales = await db.select().from(schema.sucursales).where(eq(schema.sucursales.tenantId, tenantId));
    const surco = allSucursales.find((s) => s.nombre.includes("Surco")) || allSucursales[0];
    const sanIsidro = allSucursales.find((s) => s.nombre.includes("San Isidro")) || allSucursales[1] || allSucursales[0];

    await db
      .insert(schema.cajas)
      .values([
        { tenantId, sucursalId: surco.id, nombre: "Caja 01 - Principal", tipo: "fisica", estado: "disponible" },
        { tenantId, sucursalId: surco.id, nombre: "Caja 02 - Rápida", tipo: "fisica", estado: "disponible" },
        { tenantId, sucursalId: surco.id, nombre: "Caja 03 - Autoservicio", tipo: "autoservicio", estado: "disponible" },
        { tenantId, sucursalId: sanIsidro.id, nombre: "Caja 01 - Principal Begonias", tipo: "fisica", estado: "disponible" },
        { tenantId, sucursalId: sanIsidro.id, nombre: "Caja 02 - Express Begonias", tipo: "fisica", estado: "disponible" },
      ])
      .onConflictDoNothing();

    // 5. Usuarios
    console.log("  → [5/10] Creando Colaboradores y Usuarios...");
    const userValues = DEMO_USERS.map((u) => ({
      id: u.id,
      tenantId,
      rolId: rolesBySlug.get(u.rol) || allRoles[0].id,
      nombre: u.nombre,
      email: u.email,
      pinHash: sql`crypt(${u.pin}, gen_salt('bf'))`,
      activo: true,
    }));
    await db.insert(schema.usuarios).values(userValues).onConflictDoNothing();
    const adminUser = DEMO_USERS[0];
    const cajero1 = DEMO_USERS[1];
    const cajero2 = DEMO_USERS[2];
    const supervisor = DEMO_USERS[3];
    const almacenero = DEMO_USERS[4];

    // Asignación de sucursales a usuarios
    const userBranchValues = [
      { usuarioId: adminUser.id, sucursalId: surco.id },
      { usuarioId: adminUser.id, sucursalId: sanIsidro.id },
      { usuarioId: cajero1.id, sucursalId: surco.id },
      { usuarioId: cajero2.id, sucursalId: surco.id },
      { usuarioId: supervisor.id, sucursalId: surco.id },
      { usuarioId: supervisor.id, sucursalId: sanIsidro.id },
      { usuarioId: almacenero.id, sucursalId: surco.id },
      { usuarioId: almacenero.id, sucursalId: sanIsidro.id },
    ];
    await db.insert(schema.usuariosSucursales).values(userBranchValues).onConflictDoNothing();

    // 6. Proveedores y Categorías
    console.log("  → [6/10] Creando Proveedores Mayoristas y Categorías de Supermercado...");
    const rawProveedores = [
      { razonSocial: "GLORIA S.A.", ruc: "20100190797", contactoNombre: "Marcos Del Solar", contactoTelefono: "987654321", contactoEmail: "ventas@gloria.com.pe", direccion: "Av. República de Panamá 2461 - Lima" },
      { razonSocial: "ALICORP S.A.A.", ruc: "20100055237", contactoNombre: "Patricia Romero", contactoTelefono: "976543210", contactoEmail: "pedidos@alicorp.com.pe", direccion: "Av. Argentina 4793 - Callao" },
      { razonSocial: "SAN FERNANDO S.A.", ruc: "20100162372", contactoNombre: "Ricardo Núñez", contactoTelefono: "965432109", contactoEmail: "ventas@sanfernando.com.pe", direccion: "Av. Industrial 650 - Lima" },
      { razonSocial: "LAIVE S.A.", ruc: "20100026095", contactoNombre: "Carla Paredes", contactoTelefono: "954321098", contactoEmail: "comercial@laive.com.pe", direccion: "Av. La Molina 512 - Lima" },
      { razonSocial: "NESTLÉ PERÚ S.A.", ruc: "20100032881", contactoNombre: "José Maldonado", contactoTelefono: "943210987", contactoEmail: "contacto@nestle.com.pe", direccion: "Av. Jorge Chávez 275 - Lima" },
      { razonSocial: "UNIÓN DE CERVECERÍAS PERUANAS BACKUS", ruc: "20100113662", contactoNombre: "Luis Angulo", contactoTelefono: "921098765", contactoEmail: "clientes@backus.pe", direccion: "Av. Nicolás Arriola 400 - Lima" },
    ];
    await db.insert(schema.proveedores).values(rawProveedores.map((p) => ({ tenantId, ...p }))).onConflictDoNothing();
    const allProveedores = await db.select().from(schema.proveedores).where(eq(schema.proveedores.tenantId, tenantId));
    const provGloria = allProveedores.find((p) => p.ruc === "20100190797") || allProveedores[0];
    const provAlicorp = allProveedores.find((p) => p.ruc === "20100055237") || allProveedores[0];

    const categoriaNames = [
      { key: "lacteos", nombre: "Lácteos & Huevos" },
      { key: "abarrotes", nombre: "Abarrotes & Despensa" },
      { key: "frutas", nombre: "Frutas & Verduras (Pesables)" },
      { key: "limpieza", nombre: "Limpieza & Cuidado del Hogar" },
      { key: "bebidas", nombre: "Bebidas & Gaseosas" },
      { key: "carnes", nombre: "Carnes, Pollos & Embutidos" },
      { key: "snacks", nombre: "Snacks & Confitería" },
    ];
    await db.insert(schema.categorias).values(categoriaNames.map((c) => ({ tenantId, nombre: c.nombre }))).onConflictDoNothing();
    const allCategorias = await db.select().from(schema.categorias).where(eq(schema.categorias.tenantId, tenantId));
    const catMap = new Map(allCategorias.map((c) => [c.nombre, c.id]));
    const catKeyToId = new Map<string, string>();
    categoriaNames.forEach((cn) => {
      const id = catMap.get(cn.nombre);
      if (id) catKeyToId.set(cn.key, id);
    });

    // 7. Inserción Masiva en Bloque del Catálogo de Productos
    console.log(`  → [7/10] Insertando masivamente ${RAW_PRODUCTS.length} productos con EAN-13 y stock...`);
    const productValues = RAW_PRODUCTS.map((p) => ({
      tenantId,
      sku: p.sku,
      nombre: p.nombre,
      categoriaId: catKeyToId.get(p.categoria) || allCategorias[0]?.id,
      marca: p.marca,
      unidadMedida: p.unidadMedida || "UND",
      tipo: p.tipo || "unidad",
      precioCosto: p.precioCosto,
      precioVenta: p.precioVenta,
      afectoIgv: true,
      estado: "activo" as const,
    }));
    await db.insert(schema.productos).values(productValues).onConflictDoNothing();

    const dbProducts = await db.select().from(schema.productos).where(eq(schema.productos.tenantId, tenantId));
    const productBySku = new Map(dbProducts.map((p) => [p.sku, p]));

    // Barcodes & Stock
    const barcodeValues = RAW_PRODUCTS.map((p) => {
      const dbProd = productBySku.get(p.sku);
      return dbProd ? { productoId: dbProd.id, codigo: p.barcode, esPrincipal: true } : null;
    }).filter(Boolean) as typeof schema.productosCodigosBarras.$inferInsert[];
    if (barcodeValues.length) await db.insert(schema.productosCodigosBarras).values(barcodeValues).onConflictDoNothing();

    // Stock Surco & San Isidro
    const invSurco = RAW_PRODUCTS.map((p) => {
      const dbProd = productBySku.get(p.sku);
      return dbProd
        ? {
            productoId: dbProd.id,
            sucursalId: surco.id,
            stockActual: p.stockSurco,
            stockMinimo: "20",
            stockMaximo: "1000",
            ubicacionAlmacen: "Góndola A",
          }
        : null;
    }).filter(Boolean) as typeof schema.inventario.$inferInsert[];
    if (invSurco.length) await db.insert(schema.inventario).values(invSurco).onConflictDoNothing();

    const invSanIsidro = RAW_PRODUCTS.map((p) => {
      const dbProd = productBySku.get(p.sku);
      return dbProd
        ? {
            productoId: dbProd.id,
            sucursalId: sanIsidro.id,
            stockActual: p.stockSanIsidro,
            stockMinimo: "15",
            stockMaximo: "800",
            ubicacionAlmacen: "Góndola B",
          }
        : null;
    }).filter(Boolean) as typeof schema.inventario.$inferInsert[];
    if (invSanIsidro.length) await db.insert(schema.inventario).values(invSanIsidro).onConflictDoNothing();

    // Lotes perecibles
    const lotesValues = RAW_PRODUCTS.filter((p) => p.lote && p.vencimiento)
      .map((p) => {
        const dbProd = productBySku.get(p.sku);
        return dbProd
          ? {
              productoId: dbProd.id,
              sucursalId: surco.id,
              numeroLote: p.lote!,
              fechaVencimiento: p.vencimiento!,
              cantidadInicial: p.stockSurco,
              cantidadActual: p.stockSurco,
            }
          : null;
      })
      .filter(Boolean) as typeof schema.lotes.$inferInsert[];
    if (lotesValues.length) await db.insert(schema.lotes).values(lotesValues).onConflictDoNothing();

    // 8. Clientes & Puntos
    console.log("  → [8/10] Creando Clientes y Saldos NovaClub...");
    const clientValues = RAW_CLIENTS.map((c) => ({
      tenantId,
      tipoDocumento: c.tipoDoc,
      numeroDocumento: c.numDoc,
      nombre: c.nombre,
      telefono: c.telefono || undefined,
      email: c.email || undefined,
      direccion: c.direccion || undefined,
    }));
    await db.insert(schema.clientes).values(clientValues).onConflictDoNothing();
    const dbClients = await db.select().from(schema.clientes).where(eq(schema.clientes.tenantId, tenantId));
    const clientPointsValues = dbClients.map((c) => ({
      clienteId: c.id,
      puntosAcumulados: c.numeroDocumento === "20601234567" ? 420 : c.numeroDocumento === "45892144" ? 148 : 50,
    }));
    await db.insert(schema.programaPuntos).values(clientPointsValues).onConflictDoNothing();

    // 9. Órdenes de Compra, Mermas & Transferencias
    console.log("  → [9/10] Generando Órdenes de Compra, Mermas Tributarias y Transferencias...");
    const pLeche = productBySku.get("GLO-001");
    const pAceite = productBySku.get("PRI-001");
    const pArroz = productBySku.get("COS-001");

    // Órdenes de Compra
    const [insertedOC] = await db
      .insert(schema.ordenesCompra)
      .values([
        {
          tenantId,
          sucursalId: surco.id,
          proveedorId: provGloria.id,
          estado: "recibida_completa",
          numero: "OC-2026-0001",
          fechaEmision: daysAgoDate(10),
          fechaEntregaEstimada: daysAgoDate(7),
          observaciones: "Abastecimiento quincenal lácteos",
          creadoPor: almacenero.id,
        },
        {
          tenantId,
          sucursalId: surco.id,
          proveedorId: provAlicorp.id,
          estado: "aprobada",
          numero: "OC-2026-0002",
          fechaEmision: daysAgoDate(3),
          fechaEntregaEstimada: daysAgoDate(-2),
          observaciones: "Abarrotes y aceites",
          creadoPor: almacenero.id,
        },
      ])
      .onConflictDoNothing()
      .returning();

    if (insertedOC && pLeche) {
      await db
        .insert(schema.ordenesCompraDetalle)
        .values({
          ordenCompraId: insertedOC.id,
          productoId: pLeche.id,
          cantidadPedida: "240",
          cantidadRecibida: "240",
          precioUnitarioCosto: "3.20",
        })
        .onConflictDoNothing();

      const [recepcion] = await db
        .insert(schema.recepcionesMercaderia)
        .values({
          ordenCompraId: insertedOC.id,
          numeroGuiaRemision: "GR-001-008912",
          recibidoPor: almacenero.id,
          observaciones: "Recepción 100% conforme en muelle",
        })
        .onConflictDoNothing()
        .returning();

      if (recepcion) {
        await db
          .insert(schema.recepcionesMercaderiaDetalle)
          .values({
            recepcionId: recepcion.id,
            productoId: pLeche.id,
            cantidadRecibida: "240",
          })
          .onConflictDoNothing();
      }
    }

    // Mermas y Desmedros (Art. 37 LIR)
    if (pLeche && pAceite) {
      await db
        .insert(schema.movimientosInventario)
        .values([
          {
            tenantId,
            sucursalId: surco.id,
            productoId: pLeche.id,
            tipo: "merma",
            cantidad: "4",
            motivo: "Vencimiento en góndola (Lote L-2026-081) - Acta Destrucción Art. 37 LIR",
            referenciaTipo: "merma",
            usuarioId: supervisor.id,
          },
          {
            tenantId,
            sucursalId: surco.id,
            productoId: pAceite.id,
            tipo: "merma",
            cantidad: "2",
            motivo: "Rotura de envase por caída en reposición",
            referenciaTipo: "merma",
            usuarioId: almacenero.id,
          },
        ])
        .onConflictDoNothing();
    }

    // Transferencia entre Tiendas
    const [transf] = await db
      .insert(schema.transferenciasStock)
      .values({
        tenantId,
        sucursalOrigenId: surco.id,
        sucursalDestinoId: sanIsidro.id,
        estado: "recibida",
        solicitadoPor: almacenero.id,
        recibidoPor: adminUser.id,
        creadoEn: daysAgoTs(3, 10),
        recibidoEn: daysAgoTs(2, 16),
      })
      .onConflictDoNothing()
      .returning();

    if (transf && pArroz && pAceite) {
      await db
        .insert(schema.transferenciasStockDetalle)
        .values([
          { transferenciaId: transf.id, productoId: pArroz.id, cantidad: "50" },
          { transferenciaId: transf.id, productoId: pAceite.id, cantidad: "20" },
        ])
        .onConflictDoNothing();
    }

    // 10. Ventas, Comprobantes, Sesiones y Auditoría
    console.log("  → [10/10] Generando Sesiones de Caja, Comprobantes CPE y Auditoría...");
    const allCajas = await db.select().from(schema.cajas).where(eq(schema.cajas.sucursalId, surco.id));
    const caja1 = allCajas[0];

    const [sesion] = await db
      .insert(schema.sesionesCaja)
      .values({
        cajaId: caja1.id,
        cajeroId: cajero1.id,
        fechaApertura: daysAgoTs(0, 8),
        montoApertura: "250.00",
        estado: "abierta",
      })
      .onConflictDoNothing()
      .returning();

    const sesionId = sesion?.id || (await db.select({ id: schema.sesionesCaja.id }).from(schema.sesionesCaja).limit(1))[0]?.id;

    if (sesionId && pLeche && pAceite && pArroz) {
      // Venta 1: Boleta
      const [v1] = await db
        .insert(schema.ventas)
        .values({
          tenantId,
          sucursalId: surco.id,
          cajaId: caja1.id,
          sesionCajaId: sesionId,
          cajeroId: cajero1.id,
          clienteId: dbClients[1]?.id,
          subtotal: "24.15",
          descuento: "0.00",
          igv: "4.35",
          total: "28.50",
          estado: "completada",
          creadoEn: daysAgoTs(0, 11, 42),
        })
        .onConflictDoNothing()
        .returning();

      if (v1) {
        await db
          .insert(schema.ventasDetalle)
          .values([
            { ventaId: v1.id, productoId: pLeche.id, cantidad: "2", precioUnitario: "4.50", subtotal: "9.00" },
            { ventaId: v1.id, productoId: pAceite.id, cantidad: "1", precioUnitario: "9.80", subtotal: "9.80" },
            { ventaId: v1.id, productoId: pArroz.id, cantidad: "1.865", precioUnitario: "5.20", subtotal: "9.70" },
          ])
          .onConflictDoNothing();

        await db
          .insert(schema.ventasPagos)
          .values({ ventaId: v1.id, medioPago: "efectivo", monto: "28.50" })
          .onConflictDoNothing();

        await db
          .insert(schema.comprobantes)
          .values({
            ventaId: v1.id,
            tipo: "boleta",
            serie: "B001",
            numero: "00042918",
            estadoSunat: "aceptado",
            hash: "7x8A9B2C3D4E5F6G",
            enviadoEn: daysAgoTs(0, 11, 43),
          })
          .onConflictDoNothing();
      }

      // Venta 2: Factura
      const [v2] = await db
        .insert(schema.ventas)
        .values({
          tenantId,
          sucursalId: surco.id,
          cajaId: caja1.id,
          sesionCajaId: sesionId,
          cajeroId: cajero1.id,
          clienteId: dbClients[2]?.id,
          subtotal: "123.56",
          descuento: "0.00",
          igv: "22.24",
          total: "145.80",
          estado: "completada",
          creadoEn: daysAgoTs(0, 10, 15),
        })
        .onConflictDoNothing()
        .returning();

      if (v2) {
        await db
          .insert(schema.ventasDetalle)
          .values([
            { ventaId: v2.id, productoId: pArroz.id, cantidad: "10", precioUnitario: "5.20", subtotal: "52.00" },
            { ventaId: v2.id, productoId: pAceite.id, cantidad: "5", precioUnitario: "9.80", subtotal: "49.00" },
            { ventaId: v2.id, productoId: pLeche.id, cantidad: "10", precioUnitario: "4.48", subtotal: "44.80" },
          ])
          .onConflictDoNothing();

        await db
          .insert(schema.ventasPagos)
          .values({ ventaId: v2.id, medioPago: "tarjeta", monto: "145.80", referencia: "VISA-9412" })
          .onConflictDoNothing();

        await db
          .insert(schema.comprobantes)
          .values({
            ventaId: v2.id,
            tipo: "factura",
            serie: "F001",
            numero: "00008912",
            estadoSunat: "aceptado",
            hash: "1a2B3c4D5e6F7g8H",
            enviadoEn: daysAgoTs(0, 10, 16),
          })
          .onConflictDoNothing();
      }
    }

    // Auditoría
    await db
      .insert(schema.auditoriaLog)
      .values([
        {
          tenantId,
          usuarioId: supervisor.id,
          tablaAfectada: "ventas",
          registroId: crypto.randomUUID(),
          accion: "actualizar",
          datosNuevos: { motivo: "Autorización de cancelación con PIN" },
          ipOrigen: "192.168.1.101",
        },
        {
          tenantId,
          usuarioId: adminUser.id,
          tablaAfectada: "roles",
          registroId: crypto.randomUUID(),
          accion: "actualizar",
          datosNuevos: { motivo: "Actualización de Matriz de Permisos RBAC" },
          ipOrigen: "192.168.1.100",
        },
      ])
      .onConflictDoNothing();

    console.log("=================================================================");
    console.log("✅ ¡SEED COMPLETADO EXITOSAMENTE!");
    console.log("   • Tenant: NovaMarket Supermercados S.A.C. (RUC 20608912345)");
    console.log("   • Sucursales: Surco (Principal) y Begonias San Isidro (5 Cajas)");
    console.log(`   • Productos: ${RAW_PRODUCTS.length} con EAN-13, Lotes y Stock`);
    console.log(`   • Proveedores: ${rawProveedores.length} mayoristas oficiales`);
    console.log(`   • Clientes: ${RAW_CLIENTS.length} con Programa NovaClub`);
    console.log("   • Órdenes de Compra, Mermas LIR, Transferencias y Ventas CPE");
    console.log("=================================================================");
  } catch (err) {
    console.error("❌ Error durante la ejecución del seed:", err);
  } finally {
    await client.end();
  }
}

seed();
"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, sql, gte, and, count } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

function fmtFecha(d: Date): string {
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtFechaHora(d: Date): string {
  return d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtHora(d: Date): string {
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// 1. INVENTARIO & CATÁLOGO
export async function getProductsData() {
  try {
    if (hasDb()) {
      const [productosRows, categoriasRows, inventarioRows, lotesRows] = await Promise.all([
        db
          .select({
            id: schema.productos.id,
            sku: schema.productos.sku,
            nombre: schema.productos.nombre,
            categoriaId: schema.productos.categoriaId,
            marca: schema.productos.marca,
            tipo: schema.productos.tipo,
            precioCosto: schema.productos.precioCosto,
            precioVenta: schema.productos.precioVenta,
            estado: schema.productos.estado,
          })
          .from(schema.productos)
          .where(eq(schema.productos.estado, "activo")),
        db.select().from(schema.categorias),
        db.select().from(schema.inventario),
        db.select().from(schema.lotes),
      ]);

      if (productosRows && productosRows.length > 0) {
        const catMap = new Map(categoriasRows.map((c) => [c.id, c.nombre]));
        const stockMap = new Map<string, number>();
        for (const inv of inventarioRows) {
          stockMap.set(inv.productoId, (stockMap.get(inv.productoId) ?? 0) + parseFloat(inv.stockActual));
        }
        const loteMap = new Map<string, (typeof lotesRows)[number]>();
        for (const l of lotesRows) {
          const prev = loteMap.get(l.productoId);
          if (!prev || prev.creadoEn < l.creadoEn) loteMap.set(l.productoId, l);
        }
        const today = new Date();

        return productosRows.map((p) => {
          const stock = stockMap.get(p.id) ?? 0;
          const lote = loteMap.get(p.id);
          const venc = lote?.fechaVencimiento ? new Date(`${lote.fechaVencimiento}T00:00:00`) : null;
          return {
            id: p.id,
            sku: p.sku,
            nombre: p.nombre,
            categoria: catMap.get(p.categoriaId ?? "") ?? "General",
            marca: p.marca || "NovaMarket",
            tipoVenta: (p.tipo === "peso" ? "peso" : "unidad") as "unidad" | "peso",
            stock,
            stockMin: 0,
            precioCosto: parseFloat(p.precioCosto),
            precioVenta: parseFloat(p.precioVenta),
            margen: parseFloat((((parseFloat(p.precioVenta) - parseFloat(p.precioCosto)) / parseFloat(p.precioVenta)) * 100).toFixed(1)),
            isPerecible: Boolean(lote),
            lote: lote?.numeroLote,
            vencimiento: venc ? venc.toLocaleDateString("es-PE") : undefined,
            diasVencimiento: venc ? Math.ceil((venc.getTime() - today.getTime()) / 86400000) : undefined,
          };
        });
      }
    }
  } catch (err) {
    console.warn("getProductsData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      sku: "GLO-001",
      nombre: "Leche Gloria Entera 400g",
      categoria: "Lácteos",
      marca: "Gloria",
      tipoVenta: "unidad" as const,
      stock: 48,
      stockMin: 20,
      precioCosto: 3.20,
      precioVenta: 4.50,
      margen: 28.9,
      isPerecible: true,
      lote: "L-2026-081",
      vencimiento: "15/09/2026",
      diasVencimiento: 31,
    },
    {
      id: "2",
      sku: "PRI-001",
      nombre: "Aceite Primor Premium 1L",
      categoria: "Abarrotes",
      marca: "Primor",
      tipoVenta: "unidad" as const,
      stock: 12,
      stockMin: 15,
      precioCosto: 7.50,
      precioVenta: 9.80,
      margen: 23.5,
      isPerecible: false,
    },
    {
      id: "3",
      sku: "COS-001",
      nombre: "Arroz Costeño Extra 1kg",
      categoria: "Abarrotes",
      marca: "Costeño",
      tipoVenta: "unidad" as const,
      stock: 85,
      stockMin: 30,
      precioCosto: 3.80,
      precioVenta: 5.20,
      margen: 26.9,
      isPerecible: false,
    },
    {
      id: "4",
      sku: "MAN-001",
      nombre: "Manzana Delicia Nacional (kg)",
      categoria: "Frutas & Verduras",
      marca: "Granja Fresca",
      tipoVenta: "peso" as const,
      stock: 14.5,
      stockMin: 10.0,
      precioCosto: 2.80,
      precioVenta: 4.80,
      margen: 41.7,
      isPerecible: true,
      lote: "L-2026-092",
      vencimiento: "22/08/2026",
      diasVencimiento: 7,
    },
    {
      id: "5",
      sku: "BOL-001",
      nombre: "Detergente Bolívar 1kg",
      categoria: "Limpieza",
      marca: "Bolívar",
      tipoVenta: "unidad" as const,
      stock: 35,
      stockMin: 15,
      precioCosto: 6.20,
      precioVenta: 8.50,
      margen: 27.1,
      isPerecible: false,
    },
    {
      id: "6",
      sku: "YOG-001",
      nombre: "Yogurt Gloria Fresa 1L",
      categoria: "Lácteos",
      marca: "Gloria",
      tipoVenta: "unidad" as const,
      stock: 8,
      stockMin: 15,
      precioCosto: 5.40,
      precioVenta: 7.20,
      margen: 25.0,
      isPerecible: true,
      lote: "L-2026-088",
      vencimiento: "18/08/2026",
      diasVencimiento: 3,
    },
  ];
}

// 2. CLIENTES & PROGRAMA DE PUNTOS
export async function getClientsData() {
  try {
    if (hasDb()) {
      const [clientesRows, puntosRows, ventasRows] = await Promise.all([
        db.select().from(schema.clientes),
        db.select().from(schema.programaPuntos),
        db
          .select({
            clienteId: schema.ventas.clienteId,
            total: sql<number>`coalesce(sum(${schema.ventas.total}), 0)`,
            ultima: sql<Date>`max(${schema.ventas.creadoEn})`,
          })
          .from(schema.ventas)
          .where(sql`${schema.ventas.clienteId} is not null`)
          .groupBy(schema.ventas.clienteId),
      ]);

      if (clientesRows && clientesRows.length > 0) {
        const puntosMap = new Map(puntosRows.map((p) => [p.clienteId, p.puntosAcumulados]));
        const ventasMap = new Map(ventasRows.map((v) => [v.clienteId, v]));

        return clientesRows.map((c) => {
          const puntos = puntosMap.get(c.id) ?? 0;
          const ventas = ventasMap.get(c.id);
          const categoria =
            puntos >= 300 ? "Mayorista" : puntos >= 50 ? "VIP / Frecuente" : "Estándar";
          return {
            id: c.id,
            tipoDoc: c.tipoDocumento.toUpperCase() as "DNI" | "RUC" | "CE",
            numDoc: c.numeroDocumento,
            nombre: c.nombre,
            email: c.email || "-",
            telefono: c.telefono || "-",
            direccion: c.direccion || "-",
            categoria: categoria as "Estándar" | "VIP / Frecuente" | "Mayorista",
            puntos,
            totalCompras: ventas ? parseFloat(String(ventas.total)) : 0,
            ultimaCompra: ventas?.ultima ? fmtFechaHora(ventas.ultima) : "Sin compras",
          };
        });
      }
    }
  } catch (err) {
    console.warn("getClientsData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      tipoDoc: "DNI" as const,
      numDoc: "00000000",
      nombre: "Clientes Varios / Consumidor Final",
      email: "-",
      telefono: "-",
      direccion: "-",
      categoria: "Estándar" as const,
      puntos: 0,
      totalCompras: 12450.00,
      ultimaCompra: "Hoy, 11:42",
    },
    {
      id: "2",
      tipoDoc: "DNI" as const,
      numDoc: "45892144",
      nombre: "Juan Pérez García",
      email: "juan.perez@gmail.com",
      telefono: "987-112-233",
      direccion: "Calle Los Cedros 340 - Surco",
      categoria: "VIP / Frecuente" as const,
      puntos: 148,
      totalCompras: 1480.00,
      ultimaCompra: "Hoy, 11:35",
    },
    {
      id: "3",
      tipoDoc: "RUC" as const,
      numDoc: "20601234567",
      nombre: "Inversiones Retail SAC",
      email: "facturas@inversionesretail.pe",
      telefono: "(01) 440-2010",
      direccion: "Av. Rivera Navarrete 501 - San Isidro",
      categoria: "Mayorista" as const,
      puntos: 420,
      totalCompras: 4200.00,
      ultimaCompra: "Hoy, 11:15",
    },
    {
      id: "4",
      tipoDoc: "DNI" as const,
      numDoc: "72109845",
      nombre: "Ana Torres Silva",
      email: "ana.torres@outlook.com",
      telefono: "991-445-566",
      direccion: "Av. Benavides 1820 - Miraflores",
      categoria: "VIP / Frecuente" as const,
      puntos: 86,
      totalCompras: 860.00,
      ultimaCompra: "Hoy, 10:42",
    },
  ];
}

// 3. SUCURSALES & CAJAS
export async function getBranchesAndRegistersData() {
  try {
    if (hasDb()) {
      const [sucursalesRows, cajasRows, sesionesRows, ventasHoyRows] = await Promise.all([
        db.select().from(schema.sucursales),
        db.select().from(schema.cajas),
        db
          .select({
            id: schema.sesionesCaja.id,
            cajaId: schema.sesionesCaja.cajaId,
            estado: schema.sesionesCaja.estado,
            cajeroNombre: schema.usuarios.nombre,
            fechaApertura: schema.sesionesCaja.fechaApertura,
          })
          .from(schema.sesionesCaja)
          .innerJoin(schema.usuarios, eq(schema.sesionesCaja.cajeroId, schema.usuarios.id))
          .where(eq(schema.sesionesCaja.estado, "abierta"))
          .orderBy(desc(schema.sesionesCaja.fechaApertura)),
        db
          .select({
            cajaId: schema.ventas.cajaId,
            total: sql<number>`coalesce(sum(${schema.ventas.total}), 0)`,
          })
          .from(schema.ventas)
          .where(gte(schema.ventas.creadoEn, startOfToday()))
          .groupBy(schema.ventas.cajaId),
      ]);

      if (sucursalesRows && sucursalesRows.length > 0) {
        const sesionPorCaja = new Map<string, (typeof sesionesRows)[number]>();
        for (const s of sesionesRows) {
          if (!sesionPorCaja.has(s.cajaId)) sesionPorCaja.set(s.cajaId, s);
        }
        const totalHoyPorCaja = new Map(ventasHoyRows.map((v) => [v.cajaId, parseFloat(String(v.total))]));

        return sucursalesRows.map((s, bIdx) => {
          const matchedCajas = cajasRows.filter((c) => c.sucursalId === s.id);
          return {
            id: s.id,
            nombre: s.nombre,
            codigoSunat: `000${(bIdx + 1).toString()}`,
            direccion: s.direccion || "Dirección Fiscal Principal",
            telefono: s.telefono || "(01) 619-8000",
            esPrincipal: s.esPrincipal,
            activo: s.estado === "activa",
            cajasCount: matchedCajas.length,
            cajas: matchedCajas.map((c, cIdx) => {
              const sesion = sesionPorCaja.get(c.id);
              const b = bIdx + 1;
              const cc = cIdx + 1;
              return {
                id: c.id,
                numero: cc.toString().padStart(2, "0"),
                nombre: c.nombre,
                tipo: c.tipo === "autoservicio" ? ("Autoservicio" as const) : ("Principal" as const),
                serieBoleta: `B0${b}${cc}`,
                serieFactura: `F0${b}${cc}`,
                serieNC: `BC${b}${cc}`,
                estado: sesion ? ("abierta" as const) : ("cerrada" as const),
                cajeroActual: sesion?.cajeroNombre,
                turnoActual: sesion ? `#${sesion.id.substring(0, 4).toUpperCase()}` : undefined,
                ipImpresora: c.impresoraId || "192.168.1.150",
                totalHoy: totalHoyPorCaja.get(c.id) ?? 0,
              };
            }),
          };
        });
      }
    }
  } catch (err) {
    console.warn("getBranchesAndRegistersData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      nombre: "Sucursal Central - Surco",
      codigoSunat: "0001",
      direccion: "Av. Javier Prado Este 4200 - Santiago de Surco - Lima",
      telefono: "(01) 619-8000",
      esPrincipal: true,
      activo: true,
      cajasCount: 3,
      cajas: [
        {
          id: "caja-1",
          numero: "01",
          nombre: "Caja 01 - Principal",
          tipo: "Principal" as const,
          serieBoleta: "B001",
          serieFactura: "F001",
          serieNC: "BC01",
          estado: "abierta" as const,
          cajeroActual: "Carlos Alarcón",
          turnoActual: "#124",
          ipImpresora: "192.168.1.150",
          totalHoy: 1245.80,
        },
        {
          id: "caja-2",
          numero: "02",
          nombre: "Caja 02 - Rápida",
          tipo: "Rápida" as const,
          serieBoleta: "B002",
          serieFactura: "F002",
          serieNC: "BC02",
          estado: "abierta" as const,
          cajeroActual: "María Gómez",
          turnoActual: "#089",
          ipImpresora: "192.168.1.151",
          totalHoy: 890.40,
        },
        {
          id: "caja-3",
          numero: "03",
          nombre: "Caja 03 - Autoservicio",
          tipo: "Autoservicio" as const,
          serieBoleta: "B003",
          serieFactura: "F003",
          serieNC: "BC03",
          estado: "cerrada" as const,
          ipImpresora: "USB_DIRECT",
          totalHoy: 430.00,
        },
      ],
    },
    {
      id: "2",
      nombre: "Sucursal San Isidro - Begonias",
      codigoSunat: "0002",
      direccion: "Calle Las Begonias 441 - San Isidro - Lima",
      telefono: "(01) 619-8001",
      esPrincipal: false,
      activo: true,
      cajasCount: 2,
      cajas: [
        {
          id: "caja-4",
          numero: "01",
          nombre: "Caja 01 - Principal Begonias",
          tipo: "Principal" as const,
          serieBoleta: "B004",
          serieFactura: "F004",
          serieNC: "BC04",
          estado: "abierta" as const,
          cajeroActual: "Diego Flores",
          turnoActual: "#045",
          ipImpresora: "192.168.2.150",
          totalHoy: 640.20,
        },
      ],
    },
  ];
}

// 4. USUARIOS & ROLES RBAC
export async function getUsersAndRolesData() {
  try {
    if (hasDb()) {
      const [usuariosRows, sucursalesRows, usuariosSucursalesRows, sesionesRows, cajasRows] =
        await Promise.all([
          db
            .select({
              id: schema.usuarios.id,
              nombre: schema.usuarios.nombre,
              email: schema.usuarios.email,
              activo: schema.usuarios.activo,
              rolNombre: schema.roles.nombre,
            })
            .from(schema.usuarios)
            .leftJoin(schema.roles, eq(schema.usuarios.rolId, schema.roles.id)),
          db.select().from(schema.sucursales),
          db.select().from(schema.usuariosSucursales),
          db.select().from(schema.sesionesCaja).orderBy(desc(schema.sesionesCaja.fechaApertura)),
          db.select().from(schema.cajas),
        ]);

      if (usuariosRows && usuariosRows.length > 0) {
        const sucursalMap = new Map(sucursalesRows.map((s) => [s.id, s.nombre]));
        const cajaMap = new Map(cajasRows.map((c) => [c.sucursalId, c.nombre]));
        const sucursalesPorUsuario = new Map<string, string[]>();
        for (const us of usuariosSucursalesRows) {
          const nombre = sucursalMap.get(us.sucursalId);
          if (!nombre) continue;
          const arr = sucursalesPorUsuario.get(us.usuarioId) ?? [];
          arr.push(nombre);
          sucursalesPorUsuario.set(us.usuarioId, arr);
        }
        const ultimoAccesoPorUsuario = new Map<string, Date>();
        for (const s of sesionesRows) {
          if (!ultimoAccesoPorUsuario.has(s.cajeroId)) ultimoAccesoPorUsuario.set(s.cajeroId, s.fechaApertura);
        }

        return usuariosRows.map((u) => {
          const rolLower = (u.rolNombre ?? "").toLowerCase();
          const esAdmin = rolLower.includes("admin") || rolLower.includes("super");
          const sucursales = sucursalesPorUsuario.get(u.id);
          const sucursal =
            esAdmin || !sucursales || sucursales.length === 0
              ? "Todas las sucursales"
              : sucursales.join(", ");
          const esCajero = rolLower.includes("cajero");
          const pinPseudo = String(
            1000 + (parseInt(u.id.replace(/-/g, "").slice(0, 8), 16) % 9000),
          );
          return {
            id: u.id,
            nombre: u.nombre,
            email: u.email,
            rol: (rolLower.includes("admin")
              ? "Administrador General"
              : rolLower.includes("super")
              ? "Supervisor de Tienda"
              : rolLower.includes("almac")
              ? "Encargado de Almacén"
              : "Cajero POS") as "Cajero POS" | "Supervisor de Tienda" | "Administrador General" | "Encargado de Almacén",
            sucursal,
            cajaAsignada: esCajero && sucursales && sucursales.length > 0 ? cajaMap.get(sucursales[0]) ?? undefined : undefined,
            pinSupervisor: pinPseudo,
            estado: u.activo ? ("activo" as const) : ("inactivo" as const),
            ultimoAcceso: ultimoAccesoPorUsuario.get(u.id)
              ? fmtFechaHora(ultimoAccesoPorUsuario.get(u.id)!)
              : "Sin accesos",
          };
        });
      }
    }
  } catch (err) {
    console.warn("getUsersAndRolesData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      nombre: "Carlos Alarcón",
      email: "carlos.alarcon@novamarket.pe",
      rol: "Cajero POS" as const,
      sucursal: "Sucursal Central - Surco",
      cajaAsignada: "Caja 01 - Principal",
      pinSupervisor: "4821",
      estado: "activo" as const,
      ultimoAcceso: "Hoy, 11:42",
    },
    {
      id: "2",
      nombre: "María Gómez",
      email: "maria.gomez@novamarket.pe",
      rol: "Cajero POS" as const,
      sucursal: "Sucursal Central - Surco",
      cajaAsignada: "Caja 02 - Rápida",
      pinSupervisor: "9102",
      estado: "activo" as const,
      ultimoAcceso: "Hoy, 11:35",
    },
    {
      id: "3",
      nombre: "Marcos Ramos",
      email: "marcos.ramos@novamarket.pe",
      rol: "Supervisor de Tienda" as const,
      sucursal: "Sucursal Central - Surco",
      pinSupervisor: "7741",
      estado: "activo" as const,
      ultimoAcceso: "Hoy, 10:15",
    },
    {
      id: "4",
      nombre: "Esteban Vega",
      email: "esteban.vega@novamarket.pe",
      rol: "Encargado de Almacén" as const,
      sucursal: "Todas las sucursales",
      pinSupervisor: "3319",
      estado: "activo" as const,
      ultimoAcceso: "Ayer, 18:30",
    },
    {
      id: "5",
      nombre: "Admin General",
      email: "admin@novamarket.pe",
      rol: "Administrador General" as const,
      sucursal: "Todas las sucursales",
      pinSupervisor: "9999",
      estado: "activo" as const,
      ultimoAcceso: "Hoy, 09:00",
    },
  ];
}

// 5. PROVEEDORES & COMPRAS
export async function getSuppliersData() {
  try {
    if (hasDb()) {
      const [proveedoresRows, ordenesRows, detalleRows] = await Promise.all([
        db.select().from(schema.proveedores),
        db.select().from(schema.ordenesCompra),
        db.select().from(schema.ordenesCompraDetalle),
      ]);

      if (proveedoresRows && proveedoresRows.length > 0) {
        const totalPorOrden = new Map<string, number>();
        for (const d of detalleRows) {
          totalPorOrden.set(
            d.ordenCompraId,
            (totalPorOrden.get(d.ordenCompraId) ?? 0) +
              parseFloat(d.cantidadRecibida) * parseFloat(d.precioUnitarioCosto),
          );
        }
        const totalPorProveedor = new Map<string, number>();
        for (const o of ordenesRows) {
          const total = totalPorOrden.get(o.id) ?? 0;
          totalPorProveedor.set(o.proveedorId, (totalPorProveedor.get(o.proveedorId) ?? 0) + total);
        }

        // Deduplicate rows by RUC
        const seenRuc = new Set<string>();
        const uniqueProvs = proveedoresRows.filter((p) => {
          if (!p.ruc || seenRuc.has(p.ruc)) return false;
          seenRuc.add(p.ruc);
          return true;
        });

        uniqueProvs.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));

        return uniqueProvs.map((p) => ({
          id: p.id,
          ruc: p.ruc,
          razonSocial: p.razonSocial,
          contactoNombre: p.contactoNombre || "Ejecutivo Comercial",
          telefono: p.contactoTelefono || "-",
          email: p.contactoEmail || "-",
          direccion: p.direccion || "-",
          condicionPago: "Crédito 30 días" as const,
          diasCredito: 30,
          totalComprado: totalPorProveedor.get(p.id) ?? 0,
        }));
      }
    }
  } catch (err) {
    console.warn("getSuppliersData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      ruc: "20100055237",
      razonSocial: "LECHE GLORIA SOCIEDAD ANONIMA - GLORIA S.A.",
      contactoNombre: "Roberto Mendoza (Ventas Mayoristas)",
      telefono: "(01) 470-7170",
      email: "pedidos@gloria.com.pe",
      direccion: "Av. República de Panamá 2461 - La Victoria - Lima",
      condicionPago: "Crédito 30 días" as const,
      diasCredito: 30,
      totalComprado: 64800.00,
    },
    {
      id: "2",
      ruc: "20100105862",
      razonSocial: "ALICORP S.A.A.",
      contactoNombre: "Valeria Santisteban",
      telefono: "(01) 315-0800",
      email: "distribucion@alicorp.com.pe",
      direccion: "Av. Argentina 4793 - Carmen de la Legua - Callao",
      condicionPago: "Crédito 60 días" as const,
      diasCredito: 45,
      totalComprado: 89200.00,
    },
    {
      id: "3",
      ruc: "20100035121",
      razonSocial: "COMPAÑIA NACIONAL DE CHOCOLATES DE PERU S.A.",
      contactoNombre: "Fernando Castro",
      telefono: "(01) 618-5500",
      email: "ventas@chocolates.pe",
      direccion: "Carretera Central Km 4.5 - Ate - Lima",
      condicionPago: "Contado" as const,
      diasCredito: 0,
      totalComprado: 18450.00,
    },
  ];
}

// 5.1 COMPRAS & RECEPCIONES DE FACTURAS DE PROVEEDOR
export async function getPurchasesData() {
  try {
    if (hasDb()) {
      const [ordenesRows, proveedoresRows, detalleRows, productosRows] = await Promise.all([
        db.select().from(schema.ordenesCompra).orderBy(desc(schema.ordenesCompra.creadoEn)),
        db.select().from(schema.proveedores),
        db.select().from(schema.ordenesCompraDetalle),
        db.select().from(schema.productos),
      ]);

      if (ordenesRows && ordenesRows.length > 0) {
        const provMap = new Map(proveedoresRows.map((p) => [p.id, p]));
        const prodMap = new Map(productosRows.map((p) => [p.id, p]));
        const detallePorOrden = new Map<string, typeof detalleRows>();
        for (const d of detalleRows) {
          const arr = detallePorOrden.get(d.ordenCompraId) ?? [];
          arr.push(d);
          detallePorOrden.set(d.ordenCompraId, arr);
        }

        return ordenesRows.map((o) => {
          const prov = provMap.get(o.proveedorId);
          const detalles = detallePorOrden.get(o.id) ?? [];
          const subtotal = detalles.reduce(
            (acc, d) => acc + parseFloat(d.cantidadPedida) * parseFloat(d.precioUnitarioCosto),
            0
          );
          const igv = +(subtotal * 0.18).toFixed(2);
          const total = +(subtotal + igv).toFixed(2);

          return {
            id: o.id,
            numeroFactura: o.numero || `OC-2026-${o.id.slice(0, 6).toUpperCase()}`,
            proveedorId: o.proveedorId,
            proveedorNombre: prov?.razonSocial || "Proveedor General",
            proveedorRuc: prov?.ruc || "20100000000",
            fechaEmision: fmtFecha(new Date(o.creadoEn)),
            fechaRecepcion: o.fechaEntregaEstimada || fmtFecha(new Date(o.creadoEn)),
            subtotal,
            igv,
            total,
            condicionPago: "Crédito 30 días" as const,
            estado: (o.estado.startsWith("recibida") ? "Recibido" : o.estado === "pendiente" ? "Pendiente" : "En Tránsito") as "Recibido" | "Pendiente" | "En Tránsito",
            items: detalles.map((d) => {
              const prod = prodMap.get(d.productoId);
              return {
                productoId: d.productoId,
                nombre: prod?.nombre || "Producto",
                sku: prod?.sku || "SKU-000",
                cantidad: parseFloat(d.cantidadPedida),
                costoUnitario: parseFloat(d.precioUnitarioCosto),
                total: +(parseFloat(d.cantidadPedida) * parseFloat(d.precioUnitarioCosto)).toFixed(2),
              };
            }),
          };
        });
      }
    }
  } catch (err) {
    console.warn("getPurchasesData: DB fallback:", err);
  }
  return [];
}

// 6. MOVIMIENTOS KARDEX VALORADO (SUNAT 13.1)
export async function getKardexMovementsData() {
  try {
    if (hasDb()) {
      const rows = await db
        .select({
          id: schema.movimientosInventario.id,
          tipo: schema.movimientosInventario.tipo,
          cantidad: schema.movimientosInventario.cantidad,
          motivo: schema.movimientosInventario.motivo,
          fecha: schema.movimientosInventario.creadoEn,
          productoId: schema.movimientosInventario.productoId,
          referenciaTipo: schema.movimientosInventario.referenciaTipo,
          productoNombre: schema.productos.nombre,
          sku: schema.productos.sku,
          precioCosto: schema.productos.precioCosto,
          categoriaNombre: schema.categorias.nombre,
        })
        .from(schema.movimientosInventario)
        .leftJoin(schema.productos, eq(schema.movimientosInventario.productoId, schema.productos.id))
        .leftJoin(schema.categorias, eq(schema.productos.categoriaId, schema.categorias.id))
        .orderBy(desc(schema.movimientosInventario.creadoEn))
        .limit(100);

      if (rows && rows.length > 0) {
        return rows.map((r, idx) => {
          const rawQty = parseFloat(r.cantidad);
          const absQty = Math.abs(rawQty);
          const cost = parseFloat(r.precioCosto || "3.50");

          const isEntrada =
            r.tipo === "ingreso" ||
            r.tipo === "transferencia_entrada" ||
            (r.tipo === "ajuste" && rawQty > 0);

          const esMerma = r.tipo === "merma";
          const esAjuste = r.tipo === "ajuste";
          const esTransferencia =
            r.tipo === "transferencia_salida" || r.tipo === "transferencia_entrada";
          const esCompra = r.tipo === "ingreso";

          const tipoOperacion: "01_VENTA" | "02_COMPRA" | "13_MERMA" | "11_TRANSFERENCIA" | "99_AJUSTE" =
            esMerma
              ? "13_MERMA"
              : esAjuste
              ? "99_AJUSTE"
              : esTransferencia
              ? "11_TRANSFERENCIA"
              : esCompra
              ? "02_COMPRA"
              : "01_VENTA";

          const tipoDoc: "01_FACTURA" | "03_BOLETA" | "09_GUIA" | "AJ_ACTA" =
            esTransferencia
              ? "09_GUIA"
              : esMerma || esAjuste
              ? "AJ_ACTA"
              : esCompra
              ? "01_FACTURA"
              : "03_BOLETA";

          // Extract document series if contained in brackets [DOC-...]
          const matchDoc = r.motivo?.match(/\[(.*?)\]/);
          const docSerieNumero = matchDoc
            ? matchDoc[1]
            : esTransferencia
            ? "T001-GRE"
            : esMerma
            ? `MERMA-${String(100 + idx)}`
            : esAjuste
            ? `AJ-${String(100 + idx)}`
            : `KDX-${String(1000 + idx)}`;

          const cleanMotivo = r.motivo ? r.motivo.replace(/\[(.*?)\]/, "").trim() : "Movimiento de inventario";

          return {
            id: r.id,
            fecha: fmtFechaHora(new Date(r.fecha)),
            productoId: r.productoId,
            productoNombre: r.productoNombre || "Producto Retail",
            sku: r.sku || "775123456789",
            categoria: r.categoriaNombre || "General",
            tipoOperacion,
            operacionLabel: cleanMotivo || (isEntrada ? "Ingreso de Mercadería" : "Salida de Mercadería"),
            tipoDoc,
            docSerieNumero,
            entradaCant: isEntrada ? absQty : undefined,
            entradaCostoUnit: isEntrada ? cost : undefined,
            entradaTotal: isEntrada ? +(absQty * cost).toFixed(2) : undefined,
            salidaCant: !isEntrada ? absQty : undefined,
            salidaCostoUnit: !isEntrada ? cost : undefined,
            salidaTotal: !isEntrada ? +(absQty * cost).toFixed(2) : undefined,
            saldoCant: absQty,
            saldoCostoUnit: cost,
            saldoTotal: +(absQty * cost).toFixed(2),
          };
        });
      }
    }
  } catch (err) {
    console.warn("getKardexMovementsData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      fecha: "15/08/2026 11:42",
      productoId: "1",
      productoNombre: "Leche Gloria Entera 400g",
      sku: "775123456789",
      categoria: "Lácteos",
      tipoOperacion: "01_VENTA" as const,
      operacionLabel: "Venta en Caja 01 (POS)",
      tipoDoc: "03_BOLETA" as const,
      docSerieNumero: "B001-00042918",
      salidaCant: 2,
      salidaCostoUnit: 3.40,
      salidaTotal: 6.80,
      saldoCant: 142,
      saldoCostoUnit: 3.40,
      saldoTotal: 482.80,
    },
    {
      id: "2",
      fecha: "15/08/2026 10:15",
      productoId: "1",
      productoNombre: "Leche Gloria Entera 400g",
      sku: "775123456789",
      categoria: "Lácteos",
      tipoOperacion: "02_COMPRA" as const,
      operacionLabel: "Recepción de Proveedor Gloria S.A.",
      tipoDoc: "01_FACTURA" as const,
      docSerieNumero: "F001-0089123",
      entradaCant: 48,
      entradaCostoUnit: 3.40,
      entradaTotal: 163.20,
      saldoCant: 144,
      saldoCostoUnit: 3.40,
      saldoTotal: 489.60,
    },
  ];
}

// 7. AUDITORÍA & SEGURIDAD
export async function getAuditLogsData() {
  try {
    if (hasDb()) {
      const rows = await db
        .select({
          id: schema.auditoriaLog.id,
          tablaAfectada: schema.auditoriaLog.tablaAfectada,
          accion: schema.auditoriaLog.accion,
          ipOrigen: schema.auditoriaLog.ipOrigen,
          creadoEn: schema.auditoriaLog.creadoEn,
          usuarioId: schema.auditoriaLog.usuarioId,
          usuarioNombre: schema.usuarios.nombre,
        })
        .from(schema.auditoriaLog)
        .leftJoin(schema.usuarios, eq(schema.auditoriaLog.usuarioId, schema.usuarios.id))
        .orderBy(desc(schema.auditoriaLog.creadoEn))
        .limit(50);

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id.substring(0, 8).toUpperCase(),
          timestamp: fmtFechaHora(new Date(r.creadoEn)),
          accion: `Operación sobre ${r.tablaAfectada}: ${r.accion.toUpperCase()}`,
          categoria: "Caja & POS" as const,
          severidad: "informativo" as const,
          usuario: r.usuarioNombre || "Sistema POS",
          rolUsuario: "Cajero POS",
          sucursal: "Sucursal Central - Surco",
          terminal: "Caja 01 - Principal",
          ip: r.ipOrigen || "192.168.1.101",
          detalles: `Registro de auditoría inmutable de acción ${r.accion} en ${r.tablaAfectada}.`,
          supervisorAutorizo: undefined as string | undefined,
        }));
      }
    }
  } catch (err) {
    console.warn("getAuditLogsData: DB fallback:", err);
  }

  return [
    {
      id: "EVT-90412",
      timestamp: "15/08/2026 11:35:12",
      accion: "Eliminación de Ítem en Caja Activa",
      categoria: "Caja & POS" as const,
      severidad: "advertencia" as const,
      usuario: "Carlos Alarcón",
      rolUsuario: "Cajero POS",
      sucursal: "Sucursal Central - Surco",
      terminal: "Caja 01 - Principal",
      ip: "192.168.1.101",
      detalles: "Eliminación de ítem 'Aceite Primor 1L' (S/ 9.80) del ticket en curso tras autorización de supervisor.",
      supervisorAutorizo: "Marcos Ramos (PIN Verificado)",
    },
    {
      id: "EVT-90411",
      timestamp: "15/08/2026 11:20:05",
      accion: "Modificación de Precio Unitario",
      categoria: "Seguridad" as const,
      severidad: "critico" as const,
      usuario: "Carlos Alarcón",
      rolUsuario: "Cajero POS",
      sucursal: "Sucursal Central - Surco",
      terminal: "Caja 01 - Principal",
      ip: "192.168.1.101",
      detalles: "Intento de modificación manual de precio unitario en 'Detergente Bolívar 1kg' de S/ 8.50 a S/ 7.00.",
      supervisorAutorizo: "Marcos Ramos (PIN Verificado)",
    },
  ];
}

// 8. HISTORIAL DE VENTAS & COMPROBANTES
export async function getSalesHistoryData() {
  try {
    if (hasDb()) {
      const [ventasRows, comprobantesRows, pagosRows, detalleRows, cajasRows] = await Promise.all([
        db
          .select({
            id: schema.ventas.id,
            total: schema.ventas.total,
            estado: schema.ventas.estado,
            creadoEn: schema.ventas.creadoEn,
            cajaId: schema.ventas.cajaId,
            clienteNombre: schema.clientes.nombre,
            clienteDoc: schema.clientes.numeroDocumento,
            cajeroNombre: schema.usuarios.nombre,
          })
          .from(schema.ventas)
          .leftJoin(schema.clientes, eq(schema.ventas.clienteId, schema.clientes.id))
          .leftJoin(schema.usuarios, eq(schema.ventas.cajeroId, schema.usuarios.id))
          .orderBy(desc(schema.ventas.creadoEn))
          .limit(200),
        db.select().from(schema.comprobantes),
        db.select().from(schema.ventasPagos),
        db
          .select({
            ventaId: schema.ventasDetalle.ventaId,
            cantidad: schema.ventasDetalle.cantidad,
            precioUnitario: schema.ventasDetalle.precioUnitario,
            subtotal: schema.ventasDetalle.subtotal,
            productoNombre: schema.productos.nombre,
            unidadMedida: schema.productos.unidadMedida,
          })
          .from(schema.ventasDetalle)
          .leftJoin(schema.productos, eq(schema.ventasDetalle.productoId, schema.productos.id)),
        db.select().from(schema.cajas),
      ]);

      if (ventasRows && ventasRows.length > 0) {
        const comprobanteMap = new Map<string, (typeof comprobantesRows)[number]>();
        for (const c of comprobantesRows) comprobanteMap.set(c.ventaId, c);
        const pagoMap = new Map<string, (typeof pagosRows)[number]>();
        for (const p of pagosRows) if (!pagoMap.has(p.ventaId)) pagoMap.set(p.ventaId, p);
        const detallePorVenta = new Map<string, (typeof detalleRows)[number][]>();
        for (const d of detalleRows) {
          const arr = detallePorVenta.get(d.ventaId) ?? [];
          arr.push(d);
          detallePorVenta.set(d.ventaId, arr);
        }
        const cajaMap = new Map(cajasRows.map((c) => [c.id, c.nombre]));

        return ventasRows.map((v, idx) => {
          const comprobante = comprobanteMap.get(v.id);
          const pago = pagoMap.get(v.id);
          const detalle = detallePorVenta.get(v.id) ?? [];
          const numDoc = v.clienteDoc || "00000000";
          const isRuc = numDoc.length === 11;
          const defaultTipo = isRuc ? "Factura" : "Boleta";

          return {
            id: v.id,
            comprobante: comprobante ? `${comprobante.serie}-${comprobante.numero}` : `${isRuc ? "F001" : "B001"}-${String(10000000 + idx)}`,
            tipo: (comprobante?.tipo === "factura" ? "Factura" : comprobante?.tipo === "nota_credito" ? "Nota de Crédito" : defaultTipo) as "Boleta" | "Factura" | "Nota de Crédito",
            cliente: v.clienteNombre || (numDoc === "00000000" ? "Clientes Varios" : "Cliente Particular"),
            docNumero: numDoc,
            medioPago: ((pago?.medioPago === "tarjeta" ? "tarjeta" : pago?.medioPago === "yape" ? "yape" : pago?.medioPago === "plin" ? "plin" : "efectivo") as "efectivo" | "tarjeta" | "yape" | "plin"),
            caja: cajaMap.get(v.cajaId) ?? "Caja Principal",
            cajero: v.cajeroNombre || "Carlos Alarcón",
            total: parseFloat(v.total),
            fecha: fmtFecha(new Date(v.creadoEn)),
            hora: fmtHora(new Date(v.creadoEn)),
            estadoSunat: ((comprobante?.estadoSunat === "anulado" ? "anulado" : comprobante?.estadoSunat === "enviado" ? "enviado" : "aceptado") as "aceptado" | "enviado" | "anulado"),
            hashSunat: comprobante?.hash || `U1VOQVRfSEFTSF8${v.id.slice(0, 8)}`,
            items: detalle.map((d) => ({
              cantidad: parseFloat(d.cantidad),
              descripcion: d.productoNombre || "Producto Retail",
              precioUnit: parseFloat(d.precioUnitario),
              total: parseFloat(d.subtotal),
              unidad: d.unidadMedida || "und",
            })),
          };
        });
      }
    }
  } catch (err) {
    console.warn("getSalesHistoryData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      comprobante: "B001-00042918",
      tipo: "Boleta" as const,
      cliente: "Clientes Varios",
      docNumero: "00000000",
      medioPago: "efectivo" as const,
      caja: "Caja 01 - Principal",
      cajero: "Carlos Alarcón",
      total: 28.50,
      fecha: "15/08/2026",
      hora: "11:42",
      estadoSunat: "aceptado" as const,
      hashSunat: "7x8A9B2C3D4E5F6G",
      items: [
        { cantidad: 2, descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 9.00, unidad: "und" },
        { cantidad: 1, descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 9.80, unidad: "und" },
        { cantidad: 1.5, descripcion: "Manzana Delicia Nacional (kg)", precioUnit: 4.80, total: 7.20, unidad: "kg" },
        { cantidad: 1, descripcion: "Bolsa Ecológica Biodegradable", precioUnit: 2.50, total: 2.50, unidad: "und" },
      ],
    },
    {
      id: "2",
      comprobante: "F001-00008912",
      tipo: "Factura" as const,
      cliente: "Inversiones Retail SAC",
      docNumero: "20601234567",
      medioPago: "tarjeta" as const,
      caja: "Caja 01 - Principal",
      cajero: "Carlos Alarcón",
      total: 145.80,
      fecha: "15/08/2026",
      hora: "11:15",
      estadoSunat: "aceptado" as const,
      hashSunat: "1a2B3c4D5e6F7g8H",
      items: [
        { cantidad: 10, descripcion: "Arroz Costeño Extra 1kg", precioUnit: 5.20, total: 52.00, unidad: "und" },
        { cantidad: 5, descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 49.00, unidad: "und" },
        { cantidad: 4, descripcion: "Detergente Bolívar 1kg", precioUnit: 8.50, total: 34.00, unidad: "und" },
        { cantidad: 12, descripcion: "Galletas Soda San Jorge 6pk", precioUnit: 0.90, total: 10.80, unidad: "und" },
      ],
    },
    {
      id: "3",
      comprobante: "B001-00042917",
      tipo: "Boleta" as const,
      cliente: "Juan Pérez García",
      docNumero: "45892144",
      medioPago: "yape" as const,
      caja: "Caja 02 - Rápida",
      cajero: "María Gómez",
      total: 45.80,
      fecha: "15/08/2026",
      hora: "10:55",
      estadoSunat: "aceptado" as const,
      hashSunat: "9z8Y7x6W5v4U3t2S",
      items: [
        { cantidad: 4, descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 18.00, unidad: "und" },
        { cantidad: 2, descripcion: "Yogurt Gloria Fresa 1L", precioUnit: 7.20, total: 14.40, unidad: "und" },
        { cantidad: 2.8, descripcion: "Plátano de Seda (kg)", precioUnit: 4.50, total: 12.60, unidad: "kg" },
        { cantidad: 1, descripcion: "Bolsa Plástica", precioUnit: 0.80, total: 0.80, unidad: "und" },
      ],
    },
  ];
}

// 9. DASHBOARD: RESUMEN, GRÁFICO, TOP PRODUCTOS, CAJAS, TRANSACCIONES
export interface DashboardData {
  summary: {
    ventasTurno: number;
    metaVentas: number;
    tickets: number;
    ticketPromedio: number;
    stockCritico: number;
    agotadosHoy: number;
    margenBruto: number;
    gananciaNeta: number;
  };
  chartData: { date: string; ventas: number; tickets: number }[];
  topProducts: {
    id: string;
    name: string;
    category: string;
    unitsSold: number;
    totalRevenue: number;
    stockLeft: number;
    progressPercent: number;
  }[];
  registersStatus: {
    id: string;
    name: string;
    type: "Física" | "Autoservicio" | "Rápida";
    cashier: string;
    status: "cobrando" | "libre" | "arqueo";
    openedAt: string;
    totalCollected: number;
    ticketCount: number;
  }[];
  recentTransactions: {
    id: string;
    serialNumber: string;
    docType: "Boleta" | "Factura";
    customer: string;
    paymentMethod: "efectivo" | "tarjeta" | "yape" | "plin";
    cashier: string;
    total: number;
    time: string;
    sunatStatus: "aceptado" | "enviado" | "pendiente";
  }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const hoy = startOfToday();
  const hace30Dias = new Date(hoy);
  hace30Dias.setDate(hace30Dias.getDate() - 29);

  const fallback: DashboardData = {
    summary: {
      ventasTurno: 28450,
      metaVentas: 25000,
      tickets: 1482,
      ticketPromedio: 19.2,
      stockCritico: 12,
      agotadosHoy: 4,
      margenBruto: 26.4,
      gananciaNeta: 7510.8,
    },
    chartData: [
      { date: "2026-08-15", ventas: 28450, tickets: 1482 },
      { date: "2026-08-14", ventas: 28100, tickets: 1390 },
      { date: "2026-08-13", ventas: 27800, tickets: 1250 },
      { date: "2026-08-12", ventas: 26200, tickets: 1180 },
      { date: "2026-08-11", ventas: 23700, tickets: 990 },
      { date: "2026-08-10", ventas: 22100, tickets: 940 },
      { date: "2026-08-09", ventas: 19500, tickets: 810 },
      { date: "2026-08-08", ventas: 24900, tickets: 1120 },
      { date: "2026-08-07", ventas: 27500, tickets: 1280 },
      { date: "2026-08-06", ventas: 25100, tickets: 1140 },
      { date: "2026-08-05", ventas: 21300, tickets: 890 },
      { date: "2026-08-04", ventas: 18400, tickets: 760 },
      { date: "2026-08-03", ventas: 16200, tickets: 620 },
      { date: "2026-08-02", ventas: 14700, tickets: 580 },
      { date: "2026-08-01", ventas: 12200, tickets: 450 },
    ],
    topProducts: [
      { id: "1", name: "Leche Gloria Entera 400g", category: "Lácteos", unitsSold: 342, totalRevenue: 1539.0, stockLeft: 142, progressPercent: 88 },
      { id: "2", name: "Arroz Costeño Extra 1kg", category: "Abarrotes", unitsSold: 215, totalRevenue: 1118.0, stockLeft: 18, progressPercent: 72 },
      { id: "3", name: "Aceite Primor Premium 1L", category: "Abarrotes", unitsSold: 184, totalRevenue: 1803.2, stockLeft: 64, progressPercent: 64 },
      { id: "4", name: "Manzana Delicia Nacional (kg)", category: "Frutas", unitsSold: 128, totalRevenue: 614.4, stockLeft: 8.5, progressPercent: 52 },
      { id: "5", name: "Detergente Bolívar 1kg", category: "Limpieza", unitsSold: 98, totalRevenue: 833.0, stockLeft: 45, progressPercent: 41 },
    ],
    registersStatus: [
      { id: "1", name: "Caja 01 - Principal", type: "Física", cashier: "Carlos Alarcón", status: "cobrando", openedAt: "08:00 AM", totalCollected: 12450.0, ticketCount: 642 },
      { id: "2", name: "Caja 02 - Rápida", type: "Rápida", cashier: "María Gómez", status: "libre", openedAt: "08:15 AM", totalCollected: 9820.0, ticketCount: 512 },
      { id: "3", name: "Caja 03 - Autoservicio", type: "Autoservicio", cashier: "Terminal Auto 01", status: "cobrando", openedAt: "07:30 AM", totalCollected: 6180.0, ticketCount: 328 },
    ],
    recentTransactions: [
      { id: "1", serialNumber: "B001-00042918", docType: "Boleta", customer: "Clientes Varios", paymentMethod: "efectivo", cashier: "Carlos Alarcón", total: 42.5, time: "11:42:15", sunatStatus: "aceptado" },
      { id: "2", serialNumber: "B001-00042917", docType: "Boleta", customer: "Juan Pérez (DNI 45892144)", paymentMethod: "yape", cashier: "Carlos Alarcón", total: 88.2, time: "11:35:02", sunatStatus: "aceptado" },
      { id: "3", serialNumber: "F001-00001204", docType: "Factura", customer: "Inversiones Retail SAC (RUC 20601234567)", paymentMethod: "tarjeta", cashier: "María Gómez", total: 345.0, time: "11:15:40", sunatStatus: "aceptado" },
      { id: "4", serialNumber: "B001-00042916", docType: "Boleta", customer: "Clientes Varios", paymentMethod: "efectivo", cashier: "Carlos Alarcón", total: 15.6, time: "10:58:19", sunatStatus: "aceptado" },
      { id: "5", serialNumber: "B001-00042915", docType: "Boleta", customer: "Ana Torres (DNI 72109845)", paymentMethod: "plin", cashier: "María Gómez", total: 64.9, time: "10:42:01", sunatStatus: "enviado" },
      { id: "6", serialNumber: "B001-00042914", docType: "Boleta", customer: "Clientes Varios", paymentMethod: "tarjeta", cashier: "Terminal Auto 01", total: 112.3, time: "10:30:11", sunatStatus: "aceptado" },
    ],
  };

  try {
    if (!hasDb()) return fallback;

    const [
      ventasHoyRows,
      ventasChartRows,
      detalleCostoRows,
      inventarioRows,
      topRows,
      cajasRows,
      sesionesRows,
      usuariosRows,
      ventasRecientesRows,
    ] = await Promise.all([
      db
        .select({ total: sql<number>`coalesce(sum(${schema.ventas.total}), 0)`, tickets: sql<number>`count(*)::int` })
        .from(schema.ventas)
        .where(gte(schema.ventas.creadoEn, hoy)),
      db
        .select({
          dia: sql<string>`to_char(date_trunc('day', ${schema.ventas.creadoEn}), 'YYYY-MM-DD')`,
          ventas: sql<number>`coalesce(sum(${schema.ventas.total}), 0)`,
          tickets: sql<number>`count(*)::int`,
        })
        .from(schema.ventas)
        .where(gte(schema.ventas.creadoEn, hace30Dias))
        .groupBy(sql`date_trunc('day', ${schema.ventas.creadoEn})`),
      db
        .select({
          costo: sql<number>`coalesce(sum(${schema.ventasDetalle.cantidad} * ${schema.productos.precioCosto}), 0)`,
          ventasDetalleTotal: sql<number>`coalesce(sum(${schema.ventasDetalle.subtotal}), 0)`,
        })
        .from(schema.ventasDetalle)
        .innerJoin(schema.ventas, eq(schema.ventasDetalle.ventaId, schema.ventas.id))
        .innerJoin(schema.productos, eq(schema.ventasDetalle.productoId, schema.productos.id))
        .where(gte(schema.ventas.creadoEn, hoy)),
      db.select().from(schema.inventario),
      db
        .select({
          productoId: schema.ventasDetalle.productoId,
          nombre: schema.productos.nombre,
          categoria: schema.categorias.nombre,
          unitsSold: sql<number>`coalesce(sum(${schema.ventasDetalle.cantidad}), 0)`,
          totalRevenue: sql<number>`coalesce(sum(${schema.ventasDetalle.subtotal}), 0)`,
        })
        .from(schema.ventasDetalle)
        .innerJoin(schema.productos, eq(schema.ventasDetalle.productoId, schema.productos.id))
        .leftJoin(schema.categorias, eq(schema.productos.categoriaId, schema.categorias.id))
        .groupBy(schema.ventasDetalle.productoId, schema.productos.nombre, schema.categorias.nombre)
        .orderBy(desc(sql`coalesce(sum(${schema.ventasDetalle.cantidad}), 0)`))
        .limit(5),
      db.select().from(schema.cajas),
      db
        .select({
          id: schema.sesionesCaja.id,
          cajaId: schema.sesionesCaja.cajaId,
          cajeroId: schema.sesionesCaja.cajeroId,
          fechaApertura: schema.sesionesCaja.fechaApertura,
          estado: schema.sesionesCaja.estado,
        })
        .from(schema.sesionesCaja)
        .where(eq(schema.sesionesCaja.estado, "abierta"))
        .orderBy(desc(schema.sesionesCaja.fechaApertura)),
      db.select().from(schema.usuarios),
      db
        .select({
          id: schema.ventas.id,
          creadoEn: schema.ventas.creadoEn,
          cajaId: schema.ventas.cajaId,
          cajeroId: schema.ventas.cajeroId,
          clienteNombre: schema.clientes.nombre,
          clienteDoc: schema.clientes.numeroDocumento,
          total: schema.ventas.total,
        })
        .from(schema.ventas)
        .leftJoin(schema.clientes, eq(schema.ventas.clienteId, schema.clientes.id))
        .orderBy(desc(schema.ventas.creadoEn))
        .limit(6),
    ]);

    const ventasHoy = ventasHoyRows[0];
    const ventasTurno = ventasHoy ? parseFloat(String(ventasHoy.total)) : 0;
    const tickets = ventasHoy?.tickets ?? 0;
    const ticketPromedio = tickets > 0 ? +(ventasTurno / tickets).toFixed(2) : 0;

    const chartMap = new Map<string, { ventas: number; tickets: number }>();
    for (const row of ventasChartRows) {
      chartMap.set(row.dia, { ventas: parseFloat(String(row.ventas)), tickets: row.tickets ?? 0 });
    }
    const chartData: { date: string; ventas: number; tickets: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const fecha = new Date(hace30Dias);
      fecha.setDate(hace30Dias.getDate() + i);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
      const val = chartMap.get(key);
      chartData.push({ date: key, ventas: val?.ventas ?? 0, tickets: val?.tickets ?? 0 });
    }

    let stockCritico = 0;
    let agotadosHoy = 0;
    const stockMap = new Map<string, number>();
    for (const inv of inventarioRows) {
      const stock = parseFloat(inv.stockActual);
      const min = parseFloat(inv.stockMinimo);
      if (stock < min) stockCritico++;
      if (stock <= 0) agotadosHoy++;
      stockMap.set(inv.productoId, (stockMap.get(inv.productoId) ?? 0) + stock);
    }

    const costoTurno = detalleCostoRows[0] ? parseFloat(String(detalleCostoRows[0].costo)) : 0;
    const ventasDetalleTotal = detalleCostoRows[0] ? parseFloat(String(detalleCostoRows[0].ventasDetalleTotal)) : 0;
    const gananciaNeta = +(ventasDetalleTotal - costoTurno).toFixed(2);
    const margenBruto = ventasDetalleTotal > 0 ? +(((ventasDetalleTotal - costoTurno) / ventasDetalleTotal) * 100).toFixed(1) : 0;

    const maxUnits = Math.max(1, ...topRows.map((t) => parseFloat(String(t.unitsSold))));
    const topProducts = topRows.map((t) => ({
      id: t.productoId,
      name: t.nombre,
      category: t.categoria || "General",
      unitsSold: parseFloat(String(t.unitsSold)),
      totalRevenue: parseFloat(String(t.totalRevenue)),
      stockLeft: stockMap.get(t.productoId) ?? 0,
      progressPercent: Math.min(100, Math.round((parseFloat(String(t.unitsSold)) / maxUnits) * 100)),
    }));

    const usuarioMap = new Map(usuariosRows.map((u) => [u.id, u.nombre]));
    const sesionPorCaja = new Map<string, (typeof sesionesRows)[number]>();
    for (const s of sesionesRows) if (!sesionPorCaja.has(s.cajaId)) sesionPorCaja.set(s.cajaId, s);

    const cajaNames = new Map(cajasRows.map((c) => [c.id, c.nombre]));
    const registersStatus = cajasRows.slice(0, 6).map((c, idx) => {
      const sesion = sesionPorCaja.get(c.id);
      return {
        id: c.id,
        name: c.nombre,
        type: (c.tipo === "autoservicio" ? "Autoservicio" : idx % 3 === 1 ? "Rápida" : "Física") as "Física" | "Autoservicio" | "Rápida",
        cashier: sesion ? usuarioMap.get(sesion.cajeroId) ?? "Cajero" : "Sin turno",
        status: (sesion ? "cobrando" : "libre") as "cobrando" | "libre" | "arqueo",
        openedAt: sesion ? fmtHora(new Date(sesion.fechaApertura)) : "Cerrada",
        totalCollected: 0,
        ticketCount: 0,
      };
    });

    const recentTransactions = ventasRecientesRows.map((v, idx) => {
      const docType = idx % 3 === 0 ? "Factura" : "Boleta";
      return {
        id: v.id,
        serialNumber: docType === "Boleta" ? `B001-${String(10000000 + idx)}` : `F001-${String(1000000 + idx)}`,
        docType: docType as "Boleta" | "Factura",
        customer: v.clienteNombre ? `${v.clienteNombre}${v.clienteDoc ? ` (${v.clienteDoc === "00000000" ? "Varios" : v.clienteDoc})` : ""}` : "Clientes Varios",
        paymentMethod: "efectivo" as const,
        cashier: usuarioMap.get(v.cajeroId) ?? "Cajero",
        total: parseFloat(v.total),
        time: new Date(v.creadoEn).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        sunatStatus: "aceptado" as const,
      };
    });

    return {
      summary: {
        ventasTurno,
        metaVentas: 25000,
        tickets,
        ticketPromedio,
        stockCritico,
        agotadosHoy,
        margenBruto,
        gananciaNeta,
      },
      chartData,
      topProducts,
      registersStatus,
      recentTransactions,
    };
  } catch (err) {
    console.warn("getDashboardData: DB fallback:", err);
    return fallback;
  }
}
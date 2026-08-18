"use server";

export interface CreditMovement {
  id: string;
  fecha: string;
  hora: string;
  tipo: "CARGO_VENTA" | "ABONO_PAGO";
  monto: number;
  comprobanteReferencia: string;
  medioPagoAbono?: string;
  saldoResultante: number;
  registradoPor: string;
  notas?: string;
}

export interface CustomerCreditAccount {
  id: string;
  clienteId: string;
  clienteDoc: string;
  clienteNombre: string;
  clienteTipoDoc: "DNI" | "RUC";
  telefono: string;
  email: string;
  limiteCredito: number;
  saldoDeudor: number;
  creditoDisponible: number;
  diasPlazo: number;
  fechaUltimoConsumo: string;
  fechaVencimientoProxima: string;
  estado: "al_dia" | "por_vencer" | "moroso" | "bloqueado";
  movimientos: CreditMovement[];
}

let DEMO_CREDIT_ACCOUNTS: CustomerCreditAccount[] = [
  {
    id: "cred-001",
    clienteId: "cli-1",
    clienteDoc: "20601234567",
    clienteNombre: "Inversiones Retail SAC",
    clienteTipoDoc: "RUC",
    telefono: "987 654 321",
    email: "finanzas@inversionesretail.pe",
    limiteCredito: 5000.0,
    saldoDeudor: 1250.0,
    creditoDisponible: 3750.0,
    diasPlazo: 30,
    fechaUltimoConsumo: "15/08/2026",
    fechaVencimientoProxima: "14/09/2026",
    estado: "al_dia",
    movimientos: [
      {
        id: "mov-01",
        fecha: "15/08/2026",
        hora: "14:10",
        tipo: "CARGO_VENTA",
        monto: 450.0,
        comprobanteReferencia: "F001-00001249",
        saldoResultante: 1250.0,
        registradoPor: "Carlos Alarcón",
        notas: "Compra de abarrotes por mayor a 30 días",
      },
      {
        id: "mov-02",
        fecha: "05/08/2026",
        hora: "10:30",
        tipo: "ABONO_PAGO",
        monto: 1000.0,
        comprobanteReferencia: "REC-2026-0089",
        medioPagoAbono: "Transferencia BCP",
        saldoResultante: 800.0,
        registradoPor: "María Gómez",
        notas: "Abono a cuenta bancaria",
      },
      {
        id: "mov-03",
        fecha: "01/08/2026",
        hora: "16:45",
        tipo: "CARGO_VENTA",
        monto: 800.0,
        comprobanteReferencia: "F001-00001180",
        saldoResultante: 1800.0,
        registradoPor: "Carlos Alarcón",
        notas: "Venta crédito",
      },
    ],
  },
  {
    id: "cred-002",
    clienteId: "cli-2",
    clienteDoc: "45892144",
    clienteNombre: "Juan Pérez García",
    clienteTipoDoc: "DNI",
    telefono: "951 234 567",
    email: "juan.perez@gmail.com",
    limiteCredito: 800.0,
    saldoDeudor: 245.5,
    creditoDisponible: 554.5,
    diasPlazo: 15,
    fechaUltimoConsumo: "16/08/2026",
    fechaVencimientoProxima: "31/08/2026",
    estado: "al_dia",
    movimientos: [
      {
        id: "mov-04",
        fecha: "16/08/2026",
        hora: "18:20",
        tipo: "CARGO_VENTA",
        monto: 145.5,
        comprobanteReferencia: "B001-00042940",
        saldoResultante: 245.5,
        registradoPor: "Carlos Alarcón",
        notas: "Compra semanal de víveres",
      },
      {
        id: "mov-05",
        fecha: "02/08/2026",
        hora: "11:15",
        tipo: "CARGO_VENTA",
        monto: 100.0,
        comprobanteReferencia: "B001-00042710",
        saldoResultante: 100.0,
        registradoPor: "Carlos Alarcón",
        notas: "Fiado autorizado",
      },
    ],
  },
  {
    id: "cred-003",
    clienteId: "cli-3",
    clienteDoc: "20556789123",
    clienteNombre: "Corporación Gastronómica del Sur SAC",
    clienteTipoDoc: "RUC",
    telefono: "944 887 766",
    email: "compras@gastronomicasur.pe",
    limiteCredito: 8000.0,
    saldoDeudor: 4200.0,
    creditoDisponible: 3800.0,
    diasPlazo: 30,
    fechaUltimoConsumo: "10/08/2026",
    fechaVencimientoProxima: "09/09/2026",
    estado: "por_vencer",
    movimientos: [
      {
        id: "mov-06",
        fecha: "10/08/2026",
        hora: "09:00",
        tipo: "CARGO_VENTA",
        monto: 2200.0,
        comprobanteReferencia: "F001-00001210",
        saldoResultante: 4200.0,
        registradoPor: "María Gómez",
        notas: "Insumos para cadena de restaurantes",
      },
    ],
  },
  {
    id: "cred-004",
    clienteId: "cli-4",
    clienteDoc: "10478956231",
    clienteNombre: "Pedro Mendoza Huamán",
    clienteTipoDoc: "DNI",
    telefono: "912 345 678",
    email: "pedro.mendoza@hotmail.com",
    limiteCredito: 500.0,
    saldoDeudor: 490.0,
    creditoDisponible: 10.0,
    diasPlazo: 15,
    fechaUltimoConsumo: "15/07/2026",
    fechaVencimientoProxima: "30/07/2026",
    estado: "moroso",
    movimientos: [
      {
        id: "mov-07",
        fecha: "15/07/2026",
        hora: "19:40",
        tipo: "CARGO_VENTA",
        monto: 490.0,
        comprobanteReferencia: "B001-00041800",
        saldoResultante: 490.0,
        registradoPor: "Carlos Alarcón",
        notas: "Compra crédito con mora de 19 días",
      },
    ],
  },
];

export async function getCreditAccountsAction(): Promise<CustomerCreditAccount[]> {
  return DEMO_CREDIT_ACCOUNTS;
}

export async function getCreditAccountByClientDocAction(
  doc: string
): Promise<CustomerCreditAccount | null> {
  const cleanDoc = doc.trim();
  const acc = DEMO_CREDIT_ACCOUNTS.find((a) => a.clienteDoc === cleanDoc);
  return acc || null;
}

export async function registerCreditPaymentAction(input: {
  cuentaId: string;
  montoAbono: number;
  medioPago: string;
  notas?: string;
  cajeroNombre?: string;
}): Promise<{ success: boolean; error?: string; nuevoSaldo?: number; recibo?: string }> {
  const acc = DEMO_CREDIT_ACCOUNTS.find((a) => a.id === input.cuentaId);
  if (!acc) {
    return { success: false, error: "Cuenta de crédito no encontrada." };
  }

  if (input.montoAbono <= 0) {
    return { success: false, error: "El monto del abono debe ser mayor a 0." };
  }

  if (input.montoAbono > acc.saldoDeudor) {
    return {
      success: false,
      error: `El abono (S/ ${input.montoAbono.toFixed(2)}) no puede exceder la deuda total (S/ ${acc.saldoDeudor.toFixed(2)}).`,
    };
  }

  const nuevoSaldo = +(acc.saldoDeudor - input.montoAbono).toFixed(2);
  const nuevoDisponible = +(acc.limiteCredito - nuevoSaldo).toFixed(2);

  const reciboNumero = `REC-2026-${String(Math.floor(Math.random() * 9000 + 1000))}`;
  const now = new Date();
  const fechaStr = now.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  const nuevoMovimiento: CreditMovement = {
    id: `mov-${Date.now()}`,
    fecha: fechaStr,
    hora: horaStr,
    tipo: "ABONO_PAGO",
    monto: input.montoAbono,
    comprobanteReferencia: reciboNumero,
    medioPagoAbono: input.medioPago,
    saldoResultante: nuevoSaldo,
    registradoPor: input.cajeroNombre || "Cajero Principal",
    notas: input.notas || "Abono a cuenta corriente",
  };

  acc.saldoDeudor = nuevoSaldo;
  acc.creditoDisponible = nuevoDisponible;
  if (nuevoSaldo === 0) {
    acc.estado = "al_dia";
  }
  acc.movimientos.unshift(nuevoMovimiento);

  return {
    success: true,
    nuevoSaldo,
    recibo: reciboNumero,
  };
}

export async function registerCreditSaleChargeAction(input: {
  clienteDoc: string;
  clienteNombre: string;
  clienteTipoDoc: "DNI" | "RUC";
  montoVenta: number;
  comprobanteSerieNumero: string;
  cajeroNombre?: string;
  notas?: string;
}): Promise<{ success: boolean; error?: string; cuenta?: CustomerCreditAccount }> {
  let acc = DEMO_CREDIT_ACCOUNTS.find((a) => a.clienteDoc === input.clienteDoc);

  if (!acc) {
    // Si no tiene cuenta registrada, crearla con límite base
    acc = {
      id: `cred-${Date.now()}`,
      clienteId: `cli-${Date.now()}`,
      clienteDoc: input.clienteDoc,
      clienteNombre: input.clienteNombre,
      clienteTipoDoc: input.clienteTipoDoc,
      telefono: "999 000 000",
      email: "cliente@novamarket.pe",
      limiteCredito: 1000.0,
      saldoDeudor: 0,
      creditoDisponible: 1000.0,
      diasPlazo: 30,
      fechaUltimoConsumo: "",
      fechaVencimientoProxima: "",
      estado: "al_dia",
      movimientos: [],
    };
    DEMO_CREDIT_ACCOUNTS.push(acc);
  }

  if (acc.estado === "bloqueado") {
    return { success: false, error: "La cuenta de crédito del cliente se encuentra BLOQUEADA." };
  }

  if (input.montoVenta > acc.creditoDisponible) {
    return {
      success: false,
      error: `Crédito insuficiente. Disponible: S/ ${acc.creditoDisponible.toFixed(2)}, Monto Venta: S/ ${input.montoVenta.toFixed(2)}.`,
    };
  }

  const nuevoSaldo = +(acc.saldoDeudor + input.montoVenta).toFixed(2);
  const nuevoDisponible = +(acc.limiteCredito - nuevoSaldo).toFixed(2);

  const now = new Date();
  const fechaStr = now.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  const fechaVence = new Date();
  fechaVence.setDate(fechaVence.getDate() + acc.diasPlazo);
  const fechaVenceStr = fechaVence.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const nuevoMov: CreditMovement = {
    id: `mov-${Date.now()}`,
    fecha: fechaStr,
    hora: horaStr,
    tipo: "CARGO_VENTA",
    monto: input.montoVenta,
    comprobanteReferencia: input.comprobanteSerieNumero,
    saldoResultante: nuevoSaldo,
    registradoPor: input.cajeroNombre || "Caja POS",
    notas: input.notas || "Venta a Crédito / Cuenta Corriente",
  };

  acc.saldoDeudor = nuevoSaldo;
  acc.creditoDisponible = nuevoDisponible;
  acc.fechaUltimoConsumo = fechaStr;
  acc.fechaVencimientoProxima = fechaVenceStr;
  acc.movimientos.unshift(nuevoMov);

  return { success: true, cuenta: acc };
}

export async function updateCreditAccountLimitAction(input: {
  cuentaId: string;
  nuevoLimite: number;
  diasPlazo: number;
  estado: "al_dia" | "por_vencer" | "moroso" | "bloqueado";
}): Promise<{ success: boolean; error?: string }> {
  const acc = DEMO_CREDIT_ACCOUNTS.find((a) => a.id === input.cuentaId);
  if (!acc) return { success: false, error: "Cuenta no encontrada" };

  acc.limiteCredito = input.nuevoLimite;
  acc.creditoDisponible = +(input.nuevoLimite - acc.saldoDeudor).toFixed(2);
  acc.diasPlazo = input.diasPlazo;
  acc.estado = input.estado;

  return { success: true };
}

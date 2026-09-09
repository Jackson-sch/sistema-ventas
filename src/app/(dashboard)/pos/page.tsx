"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsString } from "nuqs";

import { CartItem, PosClient, DEFAULT_CLIENT } from "@/components/pos/types";
import { PosTopBar } from "@/components/pos/pos-top-bar";
import { PosScannerBar } from "@/components/pos/pos-scanner-bar";
import { PosCartTable } from "@/components/pos/pos-cart-table";
import { PosCheckoutSidebar } from "@/components/pos/pos-checkout-sidebar";

import { CashOpeningDialog } from "@/components/pos/cash-opening-dialog";
import { CashMovementDialog } from "@/components/pos/cash-movement-dialog";
import { CashClosingDialog } from "@/components/pos/cash-closing-dialog";
import { SupervisorAuthDialog } from "@/components/pos/supervisor-auth-dialog";
import { ScaleDialog } from "@/components/pos/scale-dialog";
import { ThermalTicketDialog, TicketData } from "@/components/ventas/thermal-ticket-dialog";
import { CashReportDialog, CashShiftReportData } from "@/components/pos/cash-report-dialog";
import { SplitPaymentDialog } from "@/components/pos/split-payment-dialog";
import { PrinterSettingsDialog } from "@/components/pos/printer-settings-dialog";
import { HoldCartsDialog, HeldCart } from "@/components/pos/hold-carts-dialog";

import { offlineStorage } from "@/lib/offline/offline-storage";
import { escposDriver } from "@/lib/hardware/escpos-driver";
import { customerDisplayChannel } from "@/lib/hardware/customer-display-channel";
import { promotionEngine } from "@/lib/promotions/promotion-engine";

import { completeSaleTransactionAction, SplitPaymentInput } from "@/actions/pos-actions";
import { lookupIdentityAction } from "@/actions/identity-lookup";
import { openShiftAction, cashMovementAction, closeShiftAction } from "@/actions/cash-actions";
import { getProductsData, getClientsData } from "@/actions/data-fetchers";
import { getQuotationByIdAction, markQuotationAsConvertedAction } from "@/actions/quotation-actions";
import {
  getCreditAccountByClientDocAction,
  registerCreditSaleChargeAction,
  CustomerCreditAccount,
} from "@/actions/customer-credit-actions";

export default function PosPage() {
  // Core Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CartItem[]>([]);
  const [clients, setClients] = useState<PosClient[]>([DEFAULT_CLIENT]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Document & Customer State
  const [docType, setDocType] = useState<"boleta" | "factura">("boleta");
  const [customerName, setCustomerName] = useState("Clientes Varios");
  const [customerDoc, setCustomerDoc] = useState("00000000");
  const [customerPoints, setCustomerPoints] = useState(0);
  const [activeCreditAccount, setActiveCreditAccount] = useState<CustomerCreditAccount | null>(null);
  const [isLookingUpClient, setIsLookingUpClient] = useState(false);

  // Payment State
  const [selectedPayment, setSelectedPayment] = useState<"efectivo" | "tarjeta" | "yape" | "plin" | "mixto" | "credito">("efectivo");
  const [cashReceived, setCashReceived] = useState<string>("50");
  const [splitPaymentsList, setSplitPaymentsList] = useState<SplitPaymentInput[] | null>(null);
  const [isPointsRedeemActive, setIsPointsRedeemActive] = useState(false);

  // Cash Shift State
  const [isShiftOpen, setIsShiftOpen] = useState(true);
  const [shiftNumber, setShiftNumber] = useState("00124");
  const [registerName, setRegisterName] = useState("Caja 01 - Principal");
  const [cashierName, setCashierName] = useState("Carlos Alarcón");
  const [initialFloat, setInitialFloat] = useState(200.00);
  const [cashSalesTotal, setCashSalesTotal] = useState(1450.00);
  const [cashWithdrawals, setCashWithdrawals] = useState(0.00);

  // Modals State
  const [isOpeningOpen, setIsOpeningOpen] = useState(false);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [isSupervisorOpen, setIsSupervisorOpen] = useState(false);
  const [pendingSupervisorAction, setPendingSupervisorAction] = useState<(() => void) | null>(null);
  const [supervisorActionTitle, setSupervisorActionTitle] = useState("");
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [scaleProduct, setScaleProduct] = useState<{ id: string; name: string; sku: string; price: number }>({
    id: "4",
    name: "Manzana Delicia Nacional (kg)",
    sku: "200000012345",
    price: 4.80,
  });
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [completedTicket, setCompletedTicket] = useState<TicketData | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [activeReport, setActiveReport] = useState<CashShiftReportData | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);

  // Held Carts / Parking de Ventas State
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [isHoldCartsOpen, setIsHoldCartsOpen] = useState(false);

  // Quotation / Proforma Loading State
  const [cotizacionParam, setCotizacionParam] = useQueryState("cotizacion", parseAsString.withDefault(""));
  const [loadedQuotationId, setLoadedQuotationId] = useState<string | null>(null);

  // Load Products & Clients
  useEffect(() => {
    let cancelled = false;
    Promise.all([getProductsData(), getClientsData()])
      .then(([products, clientsData]) => {
        if (cancelled) return;
        if (products && products.length > 0) {
          const items: CartItem[] = products.map((p) => ({
            id: p.id,
            sku: p.sku,
            nombre: p.nombre,
            categoria: p.categoria,
            precio: p.precioVenta,
            cantidad: 1,
            tipo: p.tipoVenta,
          }));
          setCatalogProducts(items);
        }
        if (clientsData && clientsData.length > 0) {
          const filteredDbClients = clientsData
            .filter((c) => c.numDoc !== "00000000")
            .map((c) => ({
              id: c.id,
              doc: c.numDoc,
              name: c.nombre,
              type: c.tipoDoc,
              points: c.puntos,
            }));
          setClients([DEFAULT_CLIENT, ...filteredDbClients]);
        }
      })
      .catch((err) => console.error("Error cargando catálogo POS:", err));
    return () => { cancelled = true; };
  }, []);

  // Load Quotation from URL
  useEffect(() => {
    if (!cotizacionParam) return;
    getQuotationByIdAction(cotizacionParam).then((q) => {
      if (q && q.estado === "vigente") {
        setCart(
          q.items.map((i) => ({
            id: i.productoId,
            sku: i.sku,
            nombre: i.nombre,
            categoria: "General",
            precio: i.precioUnit,
            cantidad: i.cantidad,
            tipo: i.tipo,
          }))
        );
        setDocType(q.clienteTipoDoc === "RUC" ? "factura" : "boleta");
        setCustomerDoc(q.clienteDoc);
        setCustomerName(q.clienteNombre);
        setLoadedQuotationId(q.id);
        toast.success(`Cotización ${q.codigo} precargada en caja`, {
          description: `Cliente: ${q.clienteNombre} (${q.clienteTipoDoc}: ${q.clienteDoc})`,
        });
      }
    });
  }, [cotizacionParam]);

  // Promotion Engine Calculation
  const promoCalculation = promotionEngine.evaluateCart(
    cart,
    isPointsRedeemActive ? customerPoints : 0
  );

  const rawSubtotal = promoCalculation.totalBruto;
  const promoSavings = promoCalculation.totalAhorroPromociones;
  const pointsDiscount = promoCalculation.totalPuntosAplicadosDescuento;
  const total = promoCalculation.totalNeto;
  const subtotal = +(total / 1.18).toFixed(2);
  const igv = +(total - subtotal).toFixed(2);

  // Computed Values
  const cashNum = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashNum - total);
  const systemCashExpected = +(initialFloat + cashSalesTotal - cashWithdrawals).toFixed(2);

  // Sync to Customer Facing Display
  useEffect(() => {
    if (cart.length === 0) {
      customerDisplayChannel.emit({
        tipo: "STANDBY",
        cajaNombre: registerName,
        cajeroNombre: cashierName,
        clienteNombre: customerName,
        items: [],
        total: 0,
      });
    } else {
      customerDisplayChannel.emit({
        tipo: "UPDATE_CART",
        cajaNombre: registerName,
        cajeroNombre: cashierName,
        clienteNombre: customerName,
        items: promoCalculation.items.map((i) => ({
          id: i.id,
          sku: i.sku,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precioUnitario: i.precioFinalUnitario,
          total: i.total,
          promoAplicada: i.promoAplicada,
        })),
        subtotal,
        igv,
        ahorroPromociones: promoSavings,
        descuentoPuntos: pointsDiscount,
        puntosGanados: promoCalculation.puntosAcumuladosVenta,
        total,
      });
    }
  }, [cart, promoCalculation, customerName, registerName, cashierName, subtotal, igv, promoSavings, pointsDiscount, total]);

  // Cart Handlers
  const handleHoldCurrentCart = (alias: string) => {
    if (cart.length === 0) return;
    const newHeld: HeldCart = {
      id: `held-${Date.now()}`,
      alias,
      items: [...cart],
      docType,
      customerDoc,
      customerName,
      customerPoints,
      timestamp: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      total,
    };
    setHeldCarts((prev) => [newHeld, ...prev]);
    setCart([]);
    setCustomerDoc("");
    setCustomerName("Clientes Varios");
    setCustomerPoints(0);
    setIsPointsRedeemActive(false);
    setCashReceived("");
  };

  const handleResumeCart = (held: HeldCart) => {
    if (cart.length > 0) {
      handleHoldCurrentCart(`Espera previa #${heldCarts.length + 1}`);
    }
    setCart(held.items);
    setDocType(held.docType);
    setCustomerDoc(held.customerDoc);
    setCustomerName(held.customerName);
    setCustomerPoints(held.customerPoints);
    setHeldCarts((prev) => prev.filter((c) => c.id !== held.id));
  };

  const handleDeleteHeldCart = (cartId: string) => {
    setHeldCarts((prev) => prev.filter((c) => c.id !== cartId));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.tipo === "peso" ? +(item.cantidad + delta * 0.5).toFixed(2) : item.cantidad + delta;
            return newQty > 0 ? { ...item, cantidad: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItemWithAuth = (id: string, name: string) => {
    setSupervisorActionTitle(`Eliminación de Ítem: ${name}`);
    setPendingSupervisorAction(() => () => {
      setCart((prev) => prev.filter((item) => item.id !== id));
      toast.info(`Ítem "${name}" eliminado con autorización`);
    });
    setIsSupervisorOpen(true);
  };

  const handleCancelTicket = () => {
    if (cart.length === 0) return;
    if (cart.length > 2) {
      setSupervisorActionTitle("Anulación de Ticket Completo");
      setPendingSupervisorAction(() => () => {
        setCart([]);
        toast.info("Ticket anulado por autorización de supervisor");
      });
      setIsSupervisorOpen(true);
    } else {
      setCart([]);
      toast.info("Ticket cancelado");
    }
  };

  const handleSelectProductFromSearch = (product: CartItem) => {
    if (product.tipo === "peso") {
      setScaleProduct({
        id: product.id,
        name: product.nombre,
        sku: product.sku,
        price: product.precio,
      });
      setIsScaleOpen(true);
      toast.info(`Producto por peso: "${product.nombre}". Coloque en la balanza.`);
    } else {
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id || item.sku === product.sku);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id || item.sku === product.sku
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          );
        }
        return [{ ...product, cantidad: 1 }, ...prev];
      });
      toast.success(`Agregado: ${product.nombre} (S/ ${product.precio.toFixed(2)})`);
    }
  };

  const handleConfirmScaleWeight = (weight: number) => {
    const newItem: CartItem = {
      id: Date.now().toString(),
      sku: scaleProduct.sku,
      nombre: scaleProduct.name,
      categoria: "Pesables",
      precio: scaleProduct.price,
      cantidad: weight,
      tipo: "peso",
    };
    setCart((prev) => [newItem, ...prev]);
    toast.success(`Pesaje registrado: ${scaleProduct.name} (${weight.toFixed(3)} kg)`);
  };

  // Client Lookup
  const handleLookupClient = async (queryToSearch?: string) => {
    const raw = (queryToSearch || customerDoc).trim().replace(/\D/g, "");
    if (!raw) {
      toast.info("Ingrese un número de DNI (8 dígitos) o RUC (11 dígitos)");
      return;
    }
    const type: "DNI" | "RUC" = raw.length === 11 ? "RUC" : "DNI";
    setIsLookingUpClient(true);
    try {
      const res = await lookupIdentityAction(type, raw);
      if (res.success && res.nombreRazonSocial) {
        setCustomerName(res.nombreRazonSocial);
        setCustomerDoc(res.numDoc);
        setCustomerPoints(0);
        setSelectedClientId(null);
        if (type === "RUC") {
          setDocType("factura");
          toast.success(`SUNAT: ${res.nombreRazonSocial}`, {
            description: `Estado: ${res.estado || "ACTIVO"} • Condición: ${res.condicion || "HABIDO"}`,
          });
        } else {
          setDocType("boleta");
          toast.success(`RENIEC: ${res.nombreRazonSocial}`);
        }
        setClients((prev) => {
          if (!prev.some((c) => c.doc === res.numDoc)) {
            return [...prev, { id: `client-${res.numDoc}`, doc: res.numDoc, name: res.nombreRazonSocial, type, points: 0 }];
          }
          return prev;
        });
      } else {
        toast.error(res.error || "No se encontraron datos para el documento ingresado.");
      }
    } catch {
      toast.error("Error al consultar documento.");
    } finally {
      setIsLookingUpClient(false);
    }
  };

  // Checkout Handler
  const handleCheckout = async () => {
    if (!isShiftOpen) {
      toast.error("Debe abrir la caja antes de emitir comprobantes");
      setIsOpeningOpen(true);
      return;
    }
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    if (selectedPayment === "mixto" && !splitPaymentsList) {
      setIsSplitPaymentOpen(true);
      return;
    }
    if (selectedPayment === "credito") {
      if (customerDoc === "00000000" || customerName === "Clientes Varios") {
        toast.error("Debe ingresar el DNI o RUC del cliente para una venta al crédito.");
        return;
      }
      const acc = await getCreditAccountByClientDocAction(customerDoc);
      if (!acc) {
        toast.error("El cliente no cuenta con una línea de crédito activa.");
        return;
      }
      if (acc.estado === "bloqueado") {
        toast.error("La cuenta de crédito del cliente está BLOQUEADA por morosidad.");
        return;
      }
      if (acc.creditoDisponible < total) {
        toast.error(`Crédito insuficiente. Disponible: S/ ${acc.creditoDisponible.toFixed(2)} vs Total: S/ ${total.toFixed(2)}.`);
        return;
      }
    }

    setIsProcessingSale(true);
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const offlineRecord = await offlineStorage.saveOfflineSale({
          docType,
          clienteDoc: customerDoc,
          clienteNombre: customerName,
          medioPago: selectedPayment,
          pagos: selectedPayment === "mixto" && splitPaymentsList ? splitPaymentsList : undefined,
          montoRecibido: cashNum,
          vuelto: change,
          total,
          items: cart.map((item) => ({ id: item.id, sku: item.sku, nombre: item.nombre, precio: item.precio, cantidad: item.cantidad, tipo: item.tipo })),
        });
        const offlineTicket: TicketData = {
          comprobante: offlineRecord.offlineComprobante,
          tipo: docType === "factura" ? "Factura" : "Boleta",
          fecha: new Date().toLocaleDateString("es-PE"),
          hora: new Date().toLocaleTimeString("es-PE"),
          caja: registerName,
          cajero: cashierName,
          cliente: { nombre: customerName, documentoTipo: docType === "factura" ? "RUC" : "DNI", documentoNumero: customerDoc },
          items: cart.map((item) => ({ cantidad: item.cantidad, descripcion: item.nombre, precioUnit: item.precio, total: +(item.precio * item.cantidad).toFixed(2), unidad: item.tipo === "peso" ? "kg" : "und" })),
          medioPago: selectedPayment,
          montoRecibido: cashNum,
          vuelto: change,
          total,
          hashSunat: "[OFFLINE-PENDIENTE-SYNC]",
        };
        if (selectedPayment === "efectivo") setCashSalesTotal((prev) => +(prev + total).toFixed(2));
        setCompletedTicket(offlineTicket);
        setIsTicketDialogOpen(true);
        setCart([]);
        setCashReceived("");
        setSplitPaymentsList(null);
        toast.info(`¡Venta guardada en modo Offline! (${offlineRecord.offlineComprobante}). Se sincronizará automáticamente al volver la conexión.`);
        return;
      }

      const finalMontoRecibido = selectedPayment === "efectivo" ? (cashNum > 0 ? cashNum : total) : undefined;
      const finalVuelto = selectedPayment === "efectivo" ? (cashNum > total ? change : 0) : undefined;

      const res = await completeSaleTransactionAction({
        docType,
        clienteId: selectedClientId ?? undefined,
        clienteDoc: customerDoc,
        clienteNombre: customerName,
        medioPago: selectedPayment,
        pagos: selectedPayment === "mixto" && splitPaymentsList ? splitPaymentsList : undefined,
        montoRecibido: finalMontoRecibido,
        vuelto: finalVuelto,
        items: cart.map((item) => ({ id: item.id, sku: item.sku, nombre: item.nombre, precio: item.precio, cantidad: item.cantidad, tipo: item.tipo })),
      });

      if (res.success && res.ticketData) {
        if (selectedPayment === "efectivo") {
          setCashSalesTotal((prev) => +(prev + total).toFixed(2));
        } else if (selectedPayment === "mixto" && splitPaymentsList) {
          const cashPortion = splitPaymentsList.filter((p) => p.medioPago === "efectivo").reduce((acc, p) => acc + p.monto, 0);
          if (cashPortion > 0) setCashSalesTotal((prev) => +(prev + cashPortion).toFixed(2));
        }
        const hasCash = selectedPayment === "efectivo" || (splitPaymentsList?.some(p => p.medioPago === "efectivo") ?? false);
        escposDriver.printTicket({
          empresa: { razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.", ruc: "20608945123", direccion: "Av. Principal 123 - Surco, Lima", telefono: "(01) 748-9000" },
          sucursal: registerName, caja: registerName, cajero: cashierName,
          comprobante: res.ticketData.comprobante,
          tipoDoc: res.ticketData.comprobante.startsWith("B") ? "BOLETA DE VENTA ELECTRÓNICA" : "FACTURA ELECTRÓNICA",
          fechaEmision: `${res.ticketData.fecha} ${res.ticketData.hora}`,
          cliente: { tipoDoc: docType.toUpperCase(), numDoc: customerDoc, nombre: customerName },
          items: res.ticketData.items.map((it) => ({ descripcion: it.descripcion, cantidad: it.cantidad, unidad: it.unidad || "NIU", precioUnitario: it.precioUnit, total: it.total })),
          totales: { opGravada: subtotal, opExonerada: 0, opInafecta: 0, igv, descuentoTotal: promoSavings + pointsDiscount, total },
          pagos: [{ medio: selectedPayment, monto: total }],
          montoRecibido: finalMontoRecibido,
          vuelto: finalVuelto,
          hashSunat: res.ticketData.hashSunat,
        }, hasCash);

        setCompletedTicket(res.ticketData);
        setIsTicketDialogOpen(true);

        customerDisplayChannel.emit({
          tipo: "SALE_COMPLETED",
          cajaNombre: registerName, cajeroNombre: cashierName, clienteNombre: customerName,
          total, medioPago: selectedPayment, montoRecibido: cashNum, vuelto: change,
          comprobante: res.comprobanteSerieNumero,
        });

        if (loadedQuotationId) {
          markQuotationAsConvertedAction(loadedQuotationId, res.comprobanteSerieNumero);
          setLoadedQuotationId(null);
          setCotizacionParam(null);
        }
        if (selectedPayment === "credito") {
          registerCreditSaleChargeAction({
            clienteDoc: customerDoc, clienteNombre: customerName,
            clienteTipoDoc: docType === "factura" ? "RUC" : "DNI",
            montoVenta: total, comprobanteSerieNumero: res.comprobanteSerieNumero,
            cajeroNombre: cashierName,
          });
          setActiveCreditAccount(null);
        }
        setCart([]);
        setCashReceived("");
        setSplitPaymentsList(null);
        setIsPointsRedeemActive(false);
        toast.success(`¡Venta completada! Comprobante ${res.comprobanteSerieNumero} emitido.`);
      } else {
        toast.error(res.error || "No se pudo procesar la venta.");
      }
    } catch (err) {
      console.error("Error al procesar venta, guardando respaldo offline:", err);
      try {
        const offlineRecord = await offlineStorage.saveOfflineSale({
          docType, clienteDoc: customerDoc, clienteNombre: customerName,
          medioPago: selectedPayment,
          pagos: selectedPayment === "mixto" && splitPaymentsList ? splitPaymentsList : undefined,
          montoRecibido: cashNum, vuelto: change, total,
          items: cart.map((item) => ({ id: item.id, sku: item.sku, nombre: item.nombre, precio: item.precio, cantidad: item.cantidad, tipo: item.tipo })),
        });
        toast.warning(`Servidor no disponible. Comprobante guardado localmente: ${offlineRecord.offlineComprobante}`);
        setCart([]);
      } catch {
        toast.error("Error inesperado al emitir comprobante.");
      }
    } finally {
      setIsProcessingSale(false);
    }
  };

  const handleConfirmSplitPayment = (payments: SplitPaymentInput[]) => {
    setSplitPaymentsList(payments);
    setSelectedPayment("mixto");
    toast.success(`Cobro mixto configurado (${payments.length} medios de pago).`);
  };

  // Report & Cash Handlers
  const handleGenerateReportX = () => {
    const reportData: CashShiftReportData = {
      tipoReporte: "X", turnoNumero: shiftNumber, cajaNombre: registerName, cajeroNombre: cashierName,
      fechaApertura: new Date().toLocaleDateString("es-PE"), horaApertura: "08:00 AM",
      montoApertura: initialFloat, ventasEfectivo: cashSalesTotal, ventasTarjeta: 420.50,
      ventasYape: 180.00, ventasPlin: 65.00,
      totalVentas: +(cashSalesTotal + 420.50 + 180.00 + 65.00).toFixed(2),
      egresosCaja: cashWithdrawals, efectivoEsperado: systemCashExpected,
      conteoBoletas: 18, conteoFacturas: 4, conteoNotasCredito: 1, totalTransacciones: 23,
    };
    setActiveReport(reportData);
    setIsReportDialogOpen(true);
    toast.info("Reporte X generado (Corte parcial de turno)");
  };

  const handleOpeningConfirm = async (amount: number, cashier: string, register: string) => {
    setInitialFloat(amount);
    setCashierName(cashier);
    setRegisterName(register);
    setIsShiftOpen(true);
    setCashSalesTotal(0);
    setCashWithdrawals(0);
    setShiftNumber("00125");
    await openShiftAction({ cajaId: "caja-1", cajeroId: "carlos", montoApertura: amount, cajeroNombre: cashier, cajaNombre: register });
  };

  const handleMovementConfirm = async (type: "ingreso" | "egreso", amt: number, reason: string) => {
    if (type === "egreso") setCashWithdrawals((prev) => +(prev + amt).toFixed(2));
    else setInitialFloat((prev) => +(prev + amt).toFixed(2));
    await cashMovementAction({ sesionCajaId: "sesion-1", tipo: type === "egreso" ? "egreso" : "ingreso", monto: amt, motivo: reason, usuarioId: "carlos" });
  };

  const handleClosingConfirm = async (declaredTotal: number, difference: number, denominations: Record<string, number>) => {
    const reportData: CashShiftReportData = {
      tipoReporte: "Z", turnoNumero: shiftNumber, cajaNombre: registerName, cajeroNombre: cashierName,
      fechaApertura: new Date().toLocaleDateString("es-PE"), horaApertura: "08:00 AM",
      fechaCierre: new Date().toLocaleDateString("es-PE"), horaCierre: new Date().toLocaleTimeString("es-PE"),
      montoApertura: initialFloat, ventasEfectivo: cashSalesTotal, ventasTarjeta: 420.50,
      ventasYape: 180.00, ventasPlin: 65.00,
      totalVentas: +(cashSalesTotal + 420.50 + 180.00 + 65.00).toFixed(2),
      egresosCaja: cashWithdrawals, efectivoEsperado: systemCashExpected,
      efectivoDeclarado: declaredTotal, diferencia: difference,
      conteoBoletas: 18, conteoFacturas: 4, conteoNotasCredito: 1, totalTransacciones: 23,
    };
    setActiveReport(reportData);
    setIsReportDialogOpen(true);
    setIsShiftOpen(false);
    setCart([]);
    await closeShiftAction({ sesionCajaId: "sesion-1", montoCierreDeclarado: declaredTotal, montoCierreSistema: systemCashExpected, diferencia: difference });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[hsl(224,71%,4%)] p-4 lg:p-6 gap-4">
      <PosTopBar
        isShiftOpen={isShiftOpen}
        shiftNumber={shiftNumber}
        registerName={registerName}
        cashierName={cashierName}
        systemCashExpected={systemCashExpected}
        heldCartsCount={heldCarts.length}
        onOpenShift={() => setIsOpeningOpen(true)}
        onMovement={() => setIsMovementOpen(true)}
        onClosing={() => setIsClosingOpen(true)}
        onCancelTicket={handleCancelTicket}
        onReportX={handleGenerateReportX}
        onHoldCartsOpen={() => setIsHoldCartsOpen(true)}
        onPrinterSettings={() => setIsPrinterSettingsOpen(true)}
        onScaleOpen={() => setIsScaleOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
          <PosScannerBar catalogProducts={catalogProducts} onProductSelect={handleSelectProductFromSearch} />
          <PosCartTable items={promoCalculation.items} onUpdateQuantity={updateQuantity} onRemoveItem={removeItemWithAuth} />
        </div>

        <PosCheckoutSidebar
          cartLength={cart.length}
          total={total}
          rawSubtotal={rawSubtotal}
          promoSavings={promoSavings}
          pointsDiscount={pointsDiscount}
          subtotal={subtotal}
          igv={igv}
          puntosAcumuladosVenta={promoCalculation.puntosAcumuladosVenta}
          selectedPayment={selectedPayment}
          setSelectedPayment={setSelectedPayment}
          docType={docType}
          setDocType={setDocType}
          customerDoc={customerDoc}
          setCustomerDoc={setCustomerDoc}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPoints={customerPoints}
          setCustomerPoints={setCustomerPoints}
          clients={clients}
          setSelectedClientId={setSelectedClientId}
          isLookingUpClient={isLookingUpClient}
          setIsLookingUpClient={setIsLookingUpClient}
          lookupClient={handleLookupClient}
          cashReceived={cashReceived}
          setCashReceived={setCashReceived}
          change={change}
          splitPaymentsList={splitPaymentsList}
          activeCreditAccount={activeCreditAccount}
          setActiveCreditAccount={setActiveCreditAccount}
          isPointsRedeemActive={isPointsRedeemActive}
          setIsPointsRedeemActive={setIsPointsRedeemActive}
          setIsSplitPaymentOpen={setIsSplitPaymentOpen}
          isProcessingSale={isProcessingSale}
          onCheckout={handleCheckout}
        />
      </div>

      <CashOpeningDialog isOpen={isOpeningOpen} onClose={() => setIsOpeningOpen(false)} onConfirm={handleOpeningConfirm} />
      <CashMovementDialog isOpen={isMovementOpen} onClose={() => setIsMovementOpen(false)} onConfirm={handleMovementConfirm} />
      <CashClosingDialog isOpen={isClosingOpen} onClose={() => setIsClosingOpen(false)} systemExpected={systemCashExpected} onConfirmClose={handleClosingConfirm} />
      <SupervisorAuthDialog isOpen={isSupervisorOpen} onClose={() => setIsSupervisorOpen(false)} actionTitle={supervisorActionTitle} onAuthorized={() => { if (pendingSupervisorAction) { pendingSupervisorAction(); setPendingSupervisorAction(null); } }} />
      <ScaleDialog isOpen={isScaleOpen} onClose={() => setIsScaleOpen(false)} productName={scaleProduct.name} pricePerKg={scaleProduct.price} onConfirmWeight={handleConfirmScaleWeight} />
      <SplitPaymentDialog isOpen={isSplitPaymentOpen} onClose={() => setIsSplitPaymentOpen(false)} totalVenta={total} onConfirmSplitPayment={handleConfirmSplitPayment} />
      <ThermalTicketDialog isOpen={isTicketDialogOpen} onClose={() => setIsTicketDialogOpen(false)} ticket={completedTicket} />
      <CashReportDialog isOpen={isReportDialogOpen} onClose={() => setIsReportDialogOpen(false)} report={activeReport} />
      <PrinterSettingsDialog isOpen={isPrinterSettingsOpen} onClose={() => setIsPrinterSettingsOpen(false)} />
      <HoldCartsDialog isOpen={isHoldCartsOpen} onClose={() => setIsHoldCartsOpen(false)} heldCarts={heldCarts} onResumeCart={handleResumeCart} onDeleteHeldCart={handleDeleteHeldCart} onHoldCurrentCart={handleHoldCurrentCart} canHoldCurrent={cart.length > 0} />
    </div>
  );
}

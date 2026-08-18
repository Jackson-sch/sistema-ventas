"use client";

import { useState, useRef, useEffect } from "react";
import {
  Barcode,
  Search,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  User,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Sparkles,
  Printer,
  Percent,
  Layers,
  HelpCircle,
  Building2,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  ShieldCheck,
  Award,
  Scale,
  Wifi,
  ArrowRightLeft,
  Gift,
  Tag,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CashOpeningDialog } from "@/components/pos/cash-opening-dialog";
import { CashMovementDialog } from "@/components/pos/cash-movement-dialog";
import { CashClosingDialog } from "@/components/pos/cash-closing-dialog";
import { SupervisorAuthDialog } from "@/components/pos/supervisor-auth-dialog";
import { ScaleDialog } from "@/components/pos/scale-dialog";
import { ThermalTicketDialog, TicketData } from "@/components/ventas/thermal-ticket-dialog";
import { CashReportDialog, CashShiftReportData } from "@/components/pos/cash-report-dialog";
import { SplitPaymentDialog } from "@/components/pos/split-payment-dialog";
import { PrinterSettingsDialog } from "@/components/pos/printer-settings-dialog";
import { ConnectivityBadge } from "@/components/pos/connectivity-badge";
import { offlineStorage } from "@/lib/offline/offline-storage";
import { escposDriver } from "@/lib/hardware/escpos-driver";
import { promotionEngine } from "@/lib/promotions/promotion-engine";
import { completeSaleTransactionAction, SplitPaymentInput } from "@/actions/pos-actions";
import { lookupIdentityAction } from "@/actions/identity-lookup";
import {
  openShiftAction,
  cashMovementAction,
  closeShiftAction,
} from "@/actions/cash-actions";
import { getProductsData, getClientsData } from "@/actions/data-fetchers";

interface CartItem {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  cantidad: number;
  tipo: "unidad" | "peso";
}

const INITIAL_PRODUCTS: CartItem[] = [
  { id: "1", sku: "775123456789", nombre: "Leche Gloria Entera 400g", categoria: "Lácteos", precio: 4.50, cantidad: 2, tipo: "unidad" },
  { id: "2", sku: "775987654321", nombre: "Arroz Costeño Extra 1kg", categoria: "Abarrotes", precio: 5.20, cantidad: 1, tipo: "unidad" },
  { id: "3", sku: "775456789123", nombre: "Aceite Primor Premium 1L", categoria: "Abarrotes", precio: 9.80, cantidad: 1, tipo: "unidad" },
  { id: "4", sku: "200000012345", nombre: "Manzana Delicia Nacional (kg)", categoria: "Frutas", precio: 4.80, cantidad: 1.5, tipo: "peso" },
];

const QUICK_AMOUNTS = [10, 20, 50, 100, 200];

interface PosClient {
  id: string;
  doc: string;
  name: string;
  type: string;
  points: number;
}

const DEMO_CLIENTS: PosClient[] = [
  { id: "client-varios", doc: "00000000", name: "Clientes Varios", type: "DNI", points: 0 },
  { id: "client-demo-1", doc: "45892144", name: "Juan Pérez García", type: "DNI", points: 148 },
  { id: "client-demo-2", doc: "20601234567", name: "Inversiones Retail SAC", type: "RUC", points: 420 },
  { id: "client-demo-3", doc: "72109845", name: "Ana Torres Silva", type: "DNI", points: 86 },
];

export default function PosPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CartItem[]>(INITIAL_PRODUCTS);
  const [clients, setClients] = useState<PosClient[]>(DEMO_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<"efectivo" | "tarjeta" | "yape" | "plin" | "mixto">("efectivo");
  const [cashReceived, setCashReceived] = useState<string>("50");
  const [docType, setDocType] = useState<"boleta" | "factura">("boleta");
  const [customerName, setCustomerName] = useState("Clientes Varios");
  const [customerDoc, setCustomerDoc] = useState("00000000");
  const [customerPoints, setCustomerPoints] = useState(0);

  // Cash Shift State
  const [isShiftOpen, setIsShiftOpen] = useState(true);
  const [shiftNumber, setShiftNumber] = useState("00124");
  const [registerName, setRegisterName] = useState("Caja 01 - Principal");
  const [cashierName, setCashierName] = useState("Carlos Alarcón");
  const [initialFloat, setInitialFloat] = useState(200.00);
  const [cashSalesTotal, setCashSalesTotal] = useState(1450.00);
  const [cashWithdrawals, setCashWithdrawals] = useState(0.00);

  // Modals state
  const [isOpeningOpen, setIsOpeningOpen] = useState(false);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);
  const [isSupervisorOpen, setIsSupervisorOpen] = useState(false);
  const [pendingSupervisorAction, setPendingSupervisorAction] = useState<(() => void) | null>(null);
  const [supervisorActionTitle, setSupervisorActionTitle] = useState("");

  // Electronic Scale state
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [scaleProduct, setScaleProduct] = useState<{ id: string; name: string; sku: string; price: number }>({
    id: "4",
    name: "Manzana Delicia Nacional (kg)",
    sku: "200000012345",
    price: 4.80,
  });

  // Split Payment (Cobro Mixto) State
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [splitPaymentsList, setSplitPaymentsList] = useState<SplitPaymentInput[] | null>(null);

  // Ticket Modal state
  const [completedTicket, setCompletedTicket] = useState<TicketData | null>(null);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Cash Report Modal state
  const [activeReport, setActiveReport] = useState<CashShiftReportData | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isShiftOpen]);

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
          setClients([DEMO_CLIENTS[0], ...filteredDbClients]);
        }
      })
      .catch((err) => console.error("Error cargando catálogo POS:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Printer Settings Modal state
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
  const [isPointsRedeemActive, setIsPointsRedeemActive] = useState(false);

  // Dynamic Promotion Engine & Loyalty Points Evaluation (0ms Local Calculation)
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

  const cashNum = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashNum - total);

  const systemCashExpected = +(initialFloat + cashSalesTotal - cashWithdrawals).toFixed(2);

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

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    // 1. Exact match by SKU, Barcode, or ID
    let match = catalogProducts.find(
      (p) => p.sku.toLowerCase() === query || p.id.toLowerCase() === query
    );

    // 2. Fuzzy match by name if not found by code
    if (!match) {
      match = catalogProducts.find((p) => p.nombre.toLowerCase().includes(query));
    }

    if (match) {
      if (match.tipo === "peso") {
        setScaleProduct({
          id: match.id,
          name: match.nombre,
          sku: match.sku,
          price: match.precio,
        });
        setIsScaleOpen(true);
        toast.info(`Producto por peso: "${match.nombre}". Coloque en la balanza.`);
      } else {
        setCart((prev) => {
          const existing = prev.find((item) => item.id === match!.id);
          if (existing) {
            return prev.map((item) =>
              item.id === match!.id ? { ...item, cantidad: item.cantidad + 1 } : item
            );
          }
          return [{ ...match!, cantidad: 1 }, ...prev];
        });
        toast.success(`Agregado: ${match.nombre} (S/ ${match.precio.toFixed(2)})`);
      }
      setBarcodeInput("");
      return;
    }

    // 3. Product does NOT exist - show error toast and do NOT add any dummy item
    toast.error(`Producto no encontrado: "${barcodeInput.trim()}". Verifique el código o regístrelo en Inventario.`);
    setBarcodeInput("");
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

  const handleQuickAmount = (amt: number) => {
    setCashReceived(amt.toString());
  };

  const [isLookingUpClient, setIsLookingUpClient] = useState(false);

  const handleSelectClient = (c: PosClient) => {
    setCustomerName(c.name);
    setCustomerDoc(c.doc);
    setCustomerPoints(c.points);
    setSelectedClientId(c.id || null);
    if (c.type === "RUC") {
      setDocType("factura");
    }
    toast.success(`Cliente seleccionado: ${c.name} (${c.points} pts)`);
  };

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

        // Add to quick pills if not present
        setClients((prev) => {
          if (!prev.some((c) => c.doc === res.numDoc)) {
            return [
              ...prev,
              {
                id: `client-${res.numDoc}`,
                doc: res.numDoc,
                name: res.nombreRazonSocial,
                type: type,
                points: 0,
              },
            ];
          }
          return prev;
        });
      } else {
        toast.error(res.error || "No se encontraron datos para el documento ingresado.");
      }
    } catch (err) {
      toast.error("Error al consultar documento.");
    } finally {
      setIsLookingUpClient(false);
    }
  };

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

    setIsProcessingSale(true);
    try {
      // Automatic Offline Handling if no internet
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
          items: cart.map((item) => ({
            id: item.id,
            sku: item.sku,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            tipo: item.tipo,
          })),
        });

        const offlineTicket: TicketData = {
          comprobante: offlineRecord.offlineComprobante,
          tipo: docType === "factura" ? "Factura" : "Boleta",
          fecha: new Date().toLocaleDateString("es-PE"),
          hora: new Date().toLocaleTimeString("es-PE"),
          caja: registerName,
          cajero: cashierName,
          cliente: {
            nombre: customerName,
            documentoTipo: docType === "factura" ? "RUC" : "DNI",
            documentoNumero: customerDoc,
          },
          items: cart.map((item) => ({
            cantidad: item.cantidad,
            descripcion: item.nombre,
            precioUnit: item.precio,
            total: +(item.precio * item.cantidad).toFixed(2),
            unidad: item.tipo === "peso" ? "kg" : "und",
          })),
          medioPago: selectedPayment,
          montoRecibido: cashNum,
          vuelto: change,
          total,
          hashSunat: "[OFFLINE-PENDIENTE-SYNC]",
        };

        if (selectedPayment === "efectivo") {
          setCashSalesTotal((prev) => +(prev + total).toFixed(2));
        }

        setCompletedTicket(offlineTicket);
        setIsTicketDialogOpen(true);
        setCart([]);
        setCashReceived("");
        setSplitPaymentsList(null);
        toast.info(
          `¡Venta guardada en modo Offline! (${offlineRecord.offlineComprobante}). Se sincronizará automáticamente al volver la conexión.`
        );
        return;
      }

      const res = await completeSaleTransactionAction({
        docType,
        clienteId: selectedClientId ?? undefined,
        clienteDoc: customerDoc,
        clienteNombre: customerName,
        medioPago: selectedPayment,
        pagos: selectedPayment === "mixto" && splitPaymentsList ? splitPaymentsList : undefined,
        montoRecibido: cashNum,
        vuelto: change,
        items: cart.map((item) => ({
          id: item.id,
          sku: item.sku,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          tipo: item.tipo,
        })),
      });

      if (res.success && res.ticketData) {
        if (selectedPayment === "efectivo") {
          setCashSalesTotal((prev) => +(prev + total).toFixed(2));
        } else if (selectedPayment === "mixto" && splitPaymentsList) {
          const cashPortion = splitPaymentsList
            .filter((p) => p.medioPago === "efectivo")
            .reduce((acc, p) => acc + p.monto, 0);
          if (cashPortion > 0) {
            setCashSalesTotal((prev) => +(prev + cashPortion).toFixed(2));
          }
        }

        const hasCash = selectedPayment === "efectivo" || (splitPaymentsList?.some(p => p.medioPago === "efectivo") ?? false);
        escposDriver.printTicket({
          empresa: {
            razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
            ruc: "20608945123",
            direccion: "Av. Principal 123 - Surco, Lima",
            telefono: "(01) 748-9000",
          },
          sucursal: registerName,
          caja: registerName,
          cajero: cashierName,
          comprobante: res.ticketData.comprobante,
          tipoDoc: res.ticketData.comprobante.startsWith("B") ? "BOLETA DE VENTA ELECTRÓNICA" : "FACTURA ELECTRÓNICA",
          fechaEmision: `${res.ticketData.fecha} ${res.ticketData.hora}`,
          cliente: {
            tipoDoc: docType.toUpperCase(),
            numDoc: customerDoc,
            nombre: customerName,
          },
          items: res.ticketData.items.map((it) => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            unidad: it.unidad,
            precioUnitario: it.precioUnit,
            total: it.total,
          })),
          totales: {
            opGravada: subtotal,
            opExonerada: 0,
            opInafecta: 0,
            igv,
            descuentoTotal: promoSavings + pointsDiscount,
            total,
          },
          pagos: [{ medio: selectedPayment, monto: total }],
          vuelto: change,
          hashSunat: res.ticketData.hashSunat,
        }, hasCash);

        setCompletedTicket(res.ticketData);
        setIsTicketDialogOpen(true);
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
      // Fallback: save offline even on server network error
      try {
        const offlineRecord = await offlineStorage.saveOfflineSale({
          docType,
          clienteDoc: customerDoc,
          clienteNombre: customerName,
          medioPago: selectedPayment,
          pagos: selectedPayment === "mixto" && splitPaymentsList ? splitPaymentsList : undefined,
          montoRecibido: cashNum,
          vuelto: change,
          total,
          items: cart.map((item) => ({
            id: item.id,
            sku: item.sku,
            nombre: item.nombre,
            precio: item.precio,
            cantidad: item.cantidad,
            tipo: item.tipo,
          })),
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

  const handleGenerateReportX = () => {
    const reportData: CashShiftReportData = {
      tipoReporte: "X",
      turnoNumero: shiftNumber,
      cajaNombre: registerName,
      cajeroNombre: cashierName,
      fechaApertura: new Date().toLocaleDateString("es-PE"),
      horaApertura: "08:00 AM",
      montoApertura: initialFloat,
      ventasEfectivo: cashSalesTotal,
      ventasTarjeta: 420.50,
      ventasYape: 180.00,
      ventasPlin: 65.00,
      totalVentas: +(cashSalesTotal + 420.50 + 180.00 + 65.00).toFixed(2),
      egresosCaja: cashWithdrawals,
      efectivoEsperado: systemCashExpected,
      conteoBoletas: 18,
      conteoFacturas: 4,
      conteoNotasCredito: 1,
      totalTransacciones: 23,
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

    await openShiftAction({
      cajaId: "caja-1",
      cajeroId: "carlos",
      montoApertura: amount,
      cajeroNombre: cashier,
      cajaNombre: register,
    });
  };

  const handleMovementConfirm = async (type: "ingreso" | "egreso", amt: number, reason: string) => {
    if (type === "egreso") {
      setCashWithdrawals((prev) => +(prev + amt).toFixed(2));
    } else {
      setInitialFloat((prev) => +(prev + amt).toFixed(2));
    }

    await cashMovementAction({
      sesionCajaId: "sesion-1",
      tipo: type === "egreso" ? "egreso" : "ingreso",
      monto: amt,
      motivo: reason,
      usuarioId: "carlos",
    });
  };

  const handleClosingConfirm = async (declaredTotal: number, difference: number, denominations: Record<string, number>) => {
    const reportData: CashShiftReportData = {
      tipoReporte: "Z",
      turnoNumero: shiftNumber,
      cajaNombre: registerName,
      cajeroNombre: cashierName,
      fechaApertura: new Date().toLocaleDateString("es-PE"),
      horaApertura: "08:00 AM",
      fechaCierre: new Date().toLocaleDateString("es-PE"),
      horaCierre: new Date().toLocaleTimeString("es-PE"),
      montoApertura: initialFloat,
      ventasEfectivo: cashSalesTotal,
      ventasTarjeta: 420.50,
      ventasYape: 180.00,
      ventasPlin: 65.00,
      totalVentas: +(cashSalesTotal + 420.50 + 180.00 + 65.00).toFixed(2),
      egresosCaja: cashWithdrawals,
      efectivoEsperado: systemCashExpected,
      efectivoDeclarado: declaredTotal,
      diferencia: difference,
      conteoBoletas: 18,
      conteoFacturas: 4,
      conteoNotasCredito: 1,
      totalTransacciones: 23,
    };

    setActiveReport(reportData);
    setIsReportDialogOpen(true);
    setIsShiftOpen(false);
    setCart([]);

    await closeShiftAction({
      sesionCajaId: "sesion-1",
      montoCierreDeclarado: declaredTotal,
      montoCierreSistema: systemCashExpected,
      diferencia: difference,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[hsl(224,71%,4%)] p-4 lg:p-6 gap-4">
      {/* Session Top Bar with Cash Operations */}
      <div className="glass-panel rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${isShiftOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}></span>
            <span className="text-white font-bold">
              {isShiftOpen ? `Turno Activo: #${shiftNumber}` : "Caja Cerrada"}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">Caja: <strong className="text-slate-200">{registerName}</strong></span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">Cajero: <strong className="text-slate-200">{cashierName}</strong></span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">
            Efectivo en Gaveta: <strong className="text-emerald-400 font-mono">{formatCurrency(systemCashExpected)}</strong>
          </span>
        </div>

        {/* Quick Cash Action Buttons & Offline Connectivity */}
        <div className="flex items-center gap-2">
          <ConnectivityBadge />
          {!isShiftOpen ? (
            <button
              onClick={() => setIsOpeningOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Lock className="size-3.5" /> Abrir Turno
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsPrinterSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Configuración de Impresora Térmica & Gaveta ESC/POS"
              >
                <Printer className="size-3.5 text-blue-400" /> Impresora
              </button>
              <button
                onClick={() => setIsScaleOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                <Scale className="size-3.5" /> Balanza (kg)
              </button>
              <button
                onClick={handleGenerateReportX}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-800/60 bg-blue-950/40 text-xs font-bold text-blue-300 hover:bg-blue-900/60 transition-colors cursor-pointer"
              >
                <Receipt className="size-3.5 text-blue-400" /> Reporte X
              </button>
              <button
                onClick={() => setIsMovementOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowUpRight className="size-3.5 text-amber-400" /> Movimiento
              </button>
              <button
                onClick={() => setIsClosingOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-800/60 bg-amber-950/40 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer"
              >
                <Calculator className="size-3.5" /> Arqueo & Cierre (Z)
              </button>
              <button
                onClick={handleCancelTicket}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-800/50 transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" /> Cancelar Ticket
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Left Side: Scanner & Cart Table */}
        <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden">
          {/* Scanner / Search bar */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="size-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Escanear código de barras o ingresar SKU / Nombre (Enter)..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-inner placeholder:text-slate-600"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
              >
                Agregar
              </button>
            </form>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Receipt className="size-16 stroke-[1.2] opacity-30 text-slate-400" />
                <p className="text-sm font-semibold text-slate-400">El ticket de venta está vacío</p>
                <p className="text-xs text-slate-600">Escanea un código de barras para comenzar la venta rápida</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="pb-3 pl-2">Producto / Código</th>
                    <th className="pb-3 text-right">Precio Unit.</th>
                    <th className="pb-3 text-center">Cantidad / Peso</th>
                    <th className="pb-3 text-right">Subtotal</th>
                    <th className="pb-3 pr-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-medium">
                  {promoCalculation.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="text-white font-bold text-sm tracking-tight flex flex-wrap items-center gap-1.5">
                          <span>{item.nombre}</span>
                          {item.promoAplicada && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/60 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                              <Sparkles className="size-2.5 text-purple-400" /> {item.promoAplicada}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-500 text-[11px]">{item.sku}</span>
                          {item.descuentoTotalItem > 0 && (
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">
                              Ahorro: -S/ {item.descuentoTotalItem.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-mono text-slate-300 text-sm">
                        {item.descuentoTotalItem > 0 ? (
                          <div>
                            <span className="line-through text-slate-500 text-[11px] block">{formatCurrency(item.precioOriginal)}</span>
                            <span className="text-emerald-400 font-bold">{formatCurrency(item.precioFinalUnitario)}</span>
                          </div>
                        ) : (
                          formatCurrency(item.precioOriginal)
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-14 text-center font-mono font-bold text-white text-sm">
                            {item.cantidad} <span className="text-[10px] font-sans text-slate-400">{item.tipo === "peso" ? "kg" : "und"}</span>
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-3.5 pr-2 text-center">
                        <button
                          onClick={() => removeItemWithAuth(item.id, item.nombre)}
                          title="Eliminar con autorización de supervisor"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Checkout & Financial Totals */}
        <div className="w-full lg:w-96 flex flex-col glass-panel rounded-2xl p-5 justify-between space-y-4">
          <div className="space-y-4">
            {/* Comprobante & Cliente selector */}
            <div className="space-y-2.5 pb-4 border-b border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                <span>Comprobante SUNAT</span>
                <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setDocType("boleta")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      docType === "boleta" ? "bg-blue-600 text-white" : "text-slate-400"
                    }`}
                  >
                    Boleta
                  </button>
                  <button
                    onClick={() => setDocType("factura")}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      docType === "factura" ? "bg-blue-600 text-white" : "text-slate-400"
                    }`}
                  >
                    Factura
                  </button>
                </div>
              </div>

              {/* Customer Selector with Real-time SUNAT/RENIEC Search */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <User className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={customerDoc}
                      onChange={(e) => setCustomerDoc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleLookupClient(customerDoc);
                        }
                      }}
                      placeholder="DNI (8 d.) o RUC (11 d.)..."
                      className="w-full pl-8 pr-20 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupClient(customerDoc)}
                      disabled={isLookingUpClient}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-[10px] font-bold text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isLookingUpClient ? (
                        <span className="size-2.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      ) : (
                        <Search className="size-2.5" />
                      )}
                      SUNAT
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-400 font-medium">Razón Social / Nombre:</div>
                    <div className="text-xs font-bold text-white truncate">{customerName}</div>
                  </div>
                  {customerPoints > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPointsRedeemActive(!isPointsRedeemActive);
                        toast.info(
                          isPointsRedeemActive
                            ? "Canje de puntos desactivado."
                            : `Canje de ${customerPoints} pts activado (-S/ ${(customerPoints / 10).toFixed(2)}).`
                        );
                      }}
                      className={`flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        isPointsRedeemActive
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                      }`}
                      title="Haga clic para canjear puntos de fidelidad como descuento"
                    >
                      <Award className="size-3" /> {customerPoints} pts {isPointsRedeemActive ? "(Canjeado)" : "(Canjear)"}
                    </button>
                  )}
                </div>

                {/* Quick Client Pills */}
                <div className="flex flex-wrap items-center gap-1">
                  {clients.map((c, idx) => (
                    <button
                      key={c.id ? `client-${c.id}` : `client-${c.doc}-${idx}`}
                      type="button"
                      onClick={() => handleSelectClient(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition-colors cursor-pointer ${
                        customerDoc === c.doc
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {c.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Method Selector (4 Grid) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Medio de Pago
                </span>
                {selectedPayment === "mixto" && (
                  <span className="text-[10px] text-blue-400 font-bold font-mono">
                    {splitPaymentsList?.length || 0} Medios Asignados
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment("efectivo")}
                  className={`flex items-center p-2.5 rounded-xl border text-xs font-bold gap-2 transition-all cursor-pointer ${
                    selectedPayment === "efectivo"
                      ? "border-blue-500 bg-blue-600/20 text-blue-400 shadow-md shadow-blue-500/20"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <Banknote className="size-4 shrink-0 text-emerald-400" />
                  <span>💵 Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayment("tarjeta")}
                  className={`flex items-center p-2.5 rounded-xl border text-xs font-bold gap-2 transition-all cursor-pointer ${
                    selectedPayment === "tarjeta"
                      ? "border-blue-500 bg-blue-600/20 text-blue-400 shadow-md shadow-blue-500/20"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="size-4 shrink-0 text-blue-400" />
                  <span>💳 Tarjeta POS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayment("yape")}
                  className={`flex items-center p-2.5 rounded-xl border text-xs font-bold gap-2 transition-all cursor-pointer ${
                    selectedPayment === "yape"
                      ? "border-blue-500 bg-blue-600/20 text-blue-400 shadow-md shadow-blue-500/20"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <QrCode className="size-4 shrink-0 text-purple-400" />
                  <span>🟣 Yape / Plin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPayment("mixto");
                    setIsSplitPaymentOpen(true);
                  }}
                  className={`flex items-center p-2.5 rounded-xl border text-xs font-bold gap-2 transition-all cursor-pointer ${
                    selectedPayment === "mixto"
                      ? "border-amber-500 bg-amber-600/20 text-amber-300 shadow-md shadow-amber-500/20"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <ArrowRightLeft className="size-4 shrink-0 text-amber-400" />
                  <span>🔀 Pago Mixto</span>
                </button>
              </div>
            </div>

            {/* Split Payment Active Details Card */}
            {selectedPayment === "mixto" && (
              <div className="space-y-2 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ArrowRightLeft className="size-3.5" /> Desglose Mixto Configurado
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSplitPaymentOpen(true)}
                    className="text-[11px] text-blue-400 hover:underline font-bold"
                  >
                    Modificar
                  </button>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  {(splitPaymentsList || []).map((p, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span className="capitalize">• {p.medioPago}{p.referencia ? ` (Ref: ${p.referencia})` : ""}:</span>
                      <span className="font-bold text-white">{formatCurrency(p.monto)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cash Calculator if Efectivo */}
            {selectedPayment === "efectivo" && (
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Monto Recibido:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-500 font-bold">S/</span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-right font-mono font-bold text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Quick Bills Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAmount(amt)}
                      className="flex-1 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 font-semibold">
                  <span className="text-slate-400">Vuelto a Entregar:</span>
                  <span className="font-mono text-emerald-400 font-extrabold text-base">
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Totals & Submit */}
          <div>
            <div className="space-y-1.5 mb-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Bruto</span>
                <span className="font-mono text-slate-300">{formatCurrency(rawSubtotal)}</span>
              </div>
              {promoSavings > 0 && (
                <div className="flex justify-between text-purple-400 font-bold">
                  <span className="flex items-center gap-1"><Sparkles className="size-3" /> Ahorro Promociones</span>
                  <span className="font-mono">-{formatCurrency(promoSavings)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-amber-400 font-bold">
                  <span className="flex items-center gap-1"><Award className="size-3" /> Canje Puntos ({customerPoints} pts)</span>
                  <span className="font-mono">-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>IGV (18% incluido)</span>
                <span className="font-mono text-slate-300">{formatCurrency(igv)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-white uppercase tracking-wider block">Total a Cobrar</span>
                  {promoCalculation.puntosAcumuladosVenta > 0 && (
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                      +{promoCalculation.puntosAcumuladosVenta} pts por esta compra
                    </span>
                  )}
                </div>
                <span className="text-3xl font-black text-white font-mono tracking-tight text-right">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="size-5" /> Cobrar {formatCurrency(total)}
            </button>
          </div>
        </div>
      </div>

      {/* Cash Flow & Security Modals */}
      <CashOpeningDialog
        isOpen={isOpeningOpen}
        onClose={() => setIsOpeningOpen(false)}
        onConfirm={handleOpeningConfirm}
      />

      <CashMovementDialog
        isOpen={isMovementOpen}
        onClose={() => setIsMovementOpen(false)}
        onConfirm={handleMovementConfirm}
      />

      <CashClosingDialog
        isOpen={isClosingOpen}
        onClose={() => setIsClosingOpen(false)}
        systemExpected={systemCashExpected}
        onConfirmClose={handleClosingConfirm}
      />

      <SupervisorAuthDialog
        isOpen={isSupervisorOpen}
        onClose={() => setIsSupervisorOpen(false)}
        actionTitle={supervisorActionTitle}
        onAuthorized={() => {
          if (pendingSupervisorAction) {
            pendingSupervisorAction();
            setPendingSupervisorAction(null);
          }
        }}
      />

      {/* Electronic Scale Modal */}
      <ScaleDialog
        isOpen={isScaleOpen}
        onClose={() => setIsScaleOpen(false)}
        productName={scaleProduct.name}
        pricePerKg={scaleProduct.price}
        onConfirmWeight={handleConfirmScaleWeight}
      />

      {/* Split / Mixed Payment Dialog */}
      <SplitPaymentDialog
        isOpen={isSplitPaymentOpen}
        onClose={() => setIsSplitPaymentOpen(false)}
        totalVenta={total}
        onConfirmSplitPayment={handleConfirmSplitPayment}
      />

      {/* Real-time Electronic Thermal Ticket Dialog with SUNAT QR */}
      <ThermalTicketDialog
        isOpen={isTicketDialogOpen}
        onClose={() => setIsTicketDialogOpen(false)}
        ticket={completedTicket}
      />

      {/* Cash Shift Fiscal Reports X and Z Dialog */}
      <CashReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        report={activeReport}
      />

      {/* Hardware ESC/POS Direct Thermal Printer Configuration */}
      <PrinterSettingsDialog
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
      />
    </div>
  );
}

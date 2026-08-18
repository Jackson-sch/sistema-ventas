"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  Usb,
  Cpu,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Lock,
  RotateCcw,
  Zap,
  DollarSign,
  Scissors,
} from "lucide-react";
import { toast } from "sonner";
import { escposDriver, PrinterConfig, TicketPrintPayload } from "@/lib/hardware/escpos-driver";

interface PrinterSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrinterSettingsDialog({ isOpen, onClose }: PrinterSettingsDialogProps) {
  const [config, setConfig] = useState<PrinterConfig>(escposDriver.getConfig());
  const [isConnecting, setIsConnecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConfig(escposDriver.getConfig());
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSave = () => {
    escposDriver.saveConfig(config);
    toast.success("Configuración de impresora ESC/POS guardada.");
    onClose();
  };

  const handleConnectUsb = async () => {
    setIsConnecting(true);
    const res = await escposDriver.connectWebUsb();
    setIsConnecting(false);
    if (res.success) {
      setConfig((prev) => ({
        ...prev,
        interfaceType: "webusb",
        printerName: res.name,
      }));
      toast.success(`Impresora WebUSB conectada: ${res.name}`);
    } else {
      toast.error(res.error || "No se pudo conectar a la impresora USB.");
    }
  };

  const handleConnectSerial = async () => {
    setIsConnecting(true);
    const res = await escposDriver.connectWebSerial();
    setIsConnecting(false);
    if (res.success) {
      setConfig((prev) => ({
        ...prev,
        interfaceType: "webserial",
        printerName: res.name,
      }));
      toast.success("Impresora Serial (COM / RS-232) conectada.");
    } else {
      toast.error(res.error || "No se pudo conectar al puerto serie.");
    }
  };

  const handleTestPrint = async () => {
    const testPayload: TicketPrintPayload = {
      empresa: {
        razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
        ruc: "20608945123",
        direccion: "Av. Principal 123 - Surco, Lima",
        telefono: "(01) 748-9000",
      },
      sucursal: "Sucursal Central - 01",
      caja: "Caja 01",
      cajero: "Carlos Alarcón",
      comprobante: "PRUEBA-00001",
      tipoDoc: "TICKET DE VENTA",
      fechaEmision: new Date().toLocaleString("es-PE"),
      cliente: {
        tipoDoc: "DNI",
        numDoc: "00000000",
        nombre: "CLIENTE GENERAL",
      },
      items: [
        {
          descripcion: "TEST ITEM 1 - ACEITE",
          cantidad: 1,
          unidad: "NIU",
          precioUnitario: 9.5,
          total: 9.5,
        },
        {
          descripcion: "TEST ITEM 2 - ARROZ (KG)",
          cantidad: 2.5,
          unidad: "KGM",
          precioUnitario: 4.2,
          total: 10.5,
        },
      ],
      totales: {
        opGravada: 16.95,
        opExonerada: 0,
        opInafecta: 0,
        igv: 3.05,
        total: 20.0,
      },
      pagos: [{ medio: "efectivo", monto: 20.0 }],
      vuelto: 0,
      hashSunat: "a8f9d0c2e4b6==",
    };

    const res = await escposDriver.printTicket(testPayload, true);
    if (res.success) {
      toast.success(`Prueba enviada: ${res.mode}`);
    } else {
      toast.error(res.error || "Fallo en prueba de impresión.");
    }
  };

  const handleTestDrawer = async () => {
    const res = await escposDriver.openCashDrawer();
    if (res.success) {
      toast.success("Comando de apertura de gaveta enviado (ESC p 0 25 250).");
    } else {
      toast.error(res.error || "No se pudo disparar el pulso de la gaveta.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Printer className="size-5" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
                Hardware ESC/POS Directo
              </span>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Configuración de Impresora Térmica
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Interface Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Tipo de Conexión de Hardware:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleConnectUsb}
              className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all cursor-pointer ${
                config.interfaceType === "webusb"
                  ? "border-blue-500 bg-blue-950/40 text-blue-300 shadow-md shadow-blue-500/20"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
              }`}
            >
              <Usb className="size-5 mx-auto text-blue-400" />
              <div className="text-[11px] font-bold">WebUSB</div>
              <div className="text-[9px] text-slate-500">Cable USB</div>
            </button>

            <button
              type="button"
              onClick={handleConnectSerial}
              className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all cursor-pointer ${
                config.interfaceType === "webserial"
                  ? "border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-md shadow-cyan-500/20"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
              }`}
            >
              <Cpu className="size-5 mx-auto text-cyan-400" />
              <div className="text-[11px] font-bold">Web Serial</div>
              <div className="text-[9px] text-slate-500">COM / RS-232</div>
            </button>

            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, interfaceType: "rawbt" }))}
              className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all cursor-pointer ${
                config.interfaceType === "rawbt"
                  ? "border-purple-500 bg-purple-950/40 text-purple-300 shadow-md shadow-purple-500/20"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="size-5 mx-auto text-purple-400" />
              <div className="text-[11px] font-bold">RawBT</div>
              <div className="text-[9px] text-slate-500">Android POS</div>
            </button>

            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, interfaceType: "virtual" }))}
              className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all cursor-pointer ${
                config.interfaceType === "virtual"
                  ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-md shadow-emerald-500/20"
                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="size-5 mx-auto text-emerald-400" />
              <div className="text-[11px] font-bold">Simulador</div>
              <div className="text-[9px] text-slate-500">0 ms Latencia</div>
            </button>
          </div>
        </div>

        {/* Paper Width */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300">Ancho del Rollo Térmico:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, paperWidth: "80mm" }))}
              className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                config.paperWidth === "80mm"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              80 mm (Estándar Supermercado - 48 cols)
            </button>
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, paperWidth: "58mm" }))}
              className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                config.paperWidth === "58mm"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              58 mm (Compacto - 32 cols)
            </button>
          </div>
        </div>

        {/* Automation Toggles */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="size-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">Corte de papel automático (Autocut)</span>
            </div>
            <input
              type="checkbox"
              checked={config.autoCut}
              onChange={(e) => setConfig((prev) => ({ ...prev, autoCut: e.target.checked }))}
              className="size-4 rounded accent-blue-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200">Apertura de gaveta al cobrar efectivo</span>
                <p className="text-[10px] text-slate-500">Pulso eléctrico ESC p 0 25 250 a puerto RJ-11</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.openDrawerOnCash}
              onChange={(e) => setConfig((prev) => ({ ...prev, openDrawerOnCash: e.target.checked }))}
              className="size-4 rounded accent-blue-600"
            />
          </div>
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleTestPrint}
            className="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="size-3.5 text-blue-400" /> Probar Ticket
          </button>
          <button
            type="button"
            onClick={handleTestDrawer}
            className="py-2.5 px-3 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <DollarSign className="size-3.5 text-emerald-400" /> Abrir Gaveta
          </button>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="size-4" /> Guardar Configuración
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

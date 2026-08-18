"use client";

import { useState, useEffect, useRef } from "react";
import {
  Scale,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Zap,
  Cable,
  Sparkles,
  RotateCcw,
  Sliders,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  CommercialScaleDriver,
  ScaleProtocol,
  ScaleReading,
} from "@/lib/hardware/scale-driver";

interface ScaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  pricePerKg: number;
  onConfirmWeight: (weightKg: number) => void;
}

export function ScaleDialog({
  isOpen,
  onClose,
  productName,
  pricePerKg,
  onConfirmWeight,
}: ScaleDialogProps) {
  const [weight, setWeight] = useState<number>(1.250);
  const [isStable, setIsStable] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [protocol, setProtocol] = useState<ScaleProtocol>("toledo");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionMessage, setConnectionMessage] = useState<string>("Modo Simulación Activo");

  const driverRef = useRef<CommercialScaleDriver | null>(null);

  useEffect(() => {
    if (isOpen) {
      const driver = new CommercialScaleDriver(protocol);
      driverRef.current = driver;

      driver.onReading((reading: ScaleReading) => {
        setWeight(reading.weight);
        setIsStable(reading.isStable);
        setIsConnected(driver.getIsConnected());
      });

      // Start in smart simulation mode by default
      driver.startSimulation(1.250);
      setIsConnected(true);
      setConnectionMessage("Simulador de Balanza en Vivo");
    }

    return () => {
      if (driverRef.current) {
        driverRef.current.disconnect();
        driverRef.current = null;
      }
    };
  }, [isOpen, protocol]);

  if (!isOpen) return null;

  const totalCalculado = +(weight * pricePerKg).toFixed(2);

  const handleConnectHardware = async () => {
    if (!driverRef.current) return;
    setIsConnecting(true);

    try {
      const res = await driverRef.current.connect(9600);
      setConnectionMessage(res.message);
      setIsConnected(driverRef.current.getIsConnected());
      if (res.success) {
        toast.success(res.message);
      }
    } catch (err) {
      toast.error("No se pudo conectar con el puerto serie.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTare = async () => {
    if (driverRef.current) {
      await driverRef.current.sendTare();
      toast.info("Comando de Tara / Poner a Cero enviado a la balanza.");
    }
  };

  const handleManualWeightChange = (newVal: number) => {
    const clamped = Math.max(0.01, +newVal.toFixed(3));
    setWeight(clamped);
    if (driverRef.current) {
      driverRef.current.startSimulation(clamped);
    }
  };

  const handleConfirm = () => {
    if (weight <= 0) {
      toast.error("El peso debe ser mayor a 0 kg.");
      return;
    }
    onConfirmWeight(weight);
    toast.success(`Pesaje registrado: ${productName} (${weight.toFixed(3)} kg)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-800/50">
                  Web Serial API • RS-232 / USB
                </span>
                <span className="size-2 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Balanza Comercial en Tiempo Real
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Product Target Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Producto Pesable</span>
            <div className="text-sm font-black text-white">{productName}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Precio por Kg</span>
            <div className="text-sm font-mono font-bold text-emerald-400">
              {formatCurrency(pricePerKg)} / kg
            </div>
          </div>
        </div>

        {/* Digital Scale LED Readout */}
        <div className="p-5 rounded-3xl bg-slate-950 border-2 border-emerald-800/40 shadow-inner space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${isStable ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
              <span className="text-slate-300 font-bold text-[11px]">
                {isStable ? "⚖️ PESO ESTABLE" : "🔄 LEYENDO BALANZA..."}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {connectionMessage}
            </span>
          </div>

          {/* Large 7-segment Styled Display */}
          <div className="flex items-baseline justify-center gap-3 py-2">
            <span className="text-6xl sm:text-7xl font-black font-mono text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              {weight.toFixed(3)}
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-500/80">kg</span>
          </div>

          {/* Quick manual adjust buttons */}
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => handleManualWeightChange(weight - 0.25)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
            >
              - 250g
            </button>
            <button
              type="button"
              onClick={() => handleManualWeightChange(weight - 0.05)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
            >
              - 50g
            </button>
            <button
              type="button"
              onClick={handleTare}
              className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-800/50 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors"
            >
              <RotateCcw className="size-3 inline mr-1" /> Tara (Cero)
            </button>
            <button
              type="button"
              onClick={() => handleManualWeightChange(weight + 0.05)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
            >
              + 50g
            </button>
            <button
              type="button"
              onClick={() => handleManualWeightChange(weight + 0.25)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
            >
              + 250g
            </button>
          </div>
        </div>

        {/* Calculated Total Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            <div>Fórmula: {weight.toFixed(3)} kg × {formatCurrency(pricePerKg)}</div>
            <div className="text-[11px] text-slate-500 font-mono">Total a liquidar en ticket</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Importe Total</span>
            <div className="text-2xl font-black font-mono text-white">
              {formatCurrency(totalCalculado)}
            </div>
          </div>
        </div>

        {/* Hardware Connection Bar */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Cable className="size-4 text-blue-400" />
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as ScaleProtocol)}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="toledo">Toledo (MT-Continuous)</option>
              <option value="systel">Systel (Cuora/Croma)</option>
              <option value="cas">CAS (PD-II / AP-1)</option>
              <option value="torrey">Torrey (L-EQ)</option>
              <option value="generic">Genérico ASCII</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleConnectHardware}
            disabled={isConnecting}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Zap className="size-3.5" />
            {isConnecting ? "Conectando..." : "Conectar Puerto COM"}
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-[0.98]"
          >
            <CheckCircle2 className="size-4" />
            Confirmar Pesaje ({weight.toFixed(3)} kg = {formatCurrency(totalCalculado)})
          </button>
        </div>
      </div>
    </div>
  );
}

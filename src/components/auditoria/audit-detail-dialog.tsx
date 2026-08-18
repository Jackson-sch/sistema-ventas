"use client";

import {
  ShieldCheck,
  Clock,
  User,
  KeyRound,
  Building2,
  Cpu,
  FileCode2,
  AlertTriangle,
  Info,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AuditEvent {
  id: string;
  timestamp: string;
  accion: string;
  categoria: "Caja & POS" | "Inventario" | "Seguridad" | "Facturación SUNAT";
  severidad: "informativo" | "advertencia" | "critico";
  usuario: string;
  rolUsuario: string;
  supervisorAutorizo?: string;
  sucursal: string;
  terminal: string;
  ip: string;
  detalles: string;
  payload?: Record<string, any>;
}

interface AuditDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: AuditEvent | null;
}

export function AuditDetailDialog({
  isOpen,
  onClose,
  event,
}: AuditDetailDialogProps) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              event.severidad === "critico"
                ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                : event.severidad === "advertencia"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30"
            }`}>
              {event.severidad === "critico" && <AlertOctagon className="size-5" />}
              {event.severidad === "advertencia" && <AlertTriangle className="size-5" />}
              {event.severidad === "informativo" && <Info className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{event.accion}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  event.severidad === "critico"
                    ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                    : event.severidad === "advertencia"
                    ? "bg-amber-950/80 text-amber-400 border border-amber-800/60"
                    : "bg-blue-950/80 text-blue-400 border border-blue-800/60"
                }`}>
                  {event.severidad}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">ID de Evento: {event.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Clock className="size-3 text-slate-400" /> Fecha & Hora
            </span>
            <div className="font-mono font-bold text-white">{event.timestamp}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <User className="size-3 text-slate-400" /> Colaborador Ejecutor
            </span>
            <div className="font-bold text-white">{event.usuario}</div>
            <div className="text-[11px] text-blue-400">{event.rolUsuario}</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Building2 className="size-3 text-slate-400" /> Ubicación & Terminal
            </span>
            <div className="font-semibold text-white">{event.sucursal}</div>
            <div className="text-[11px] text-slate-400 font-mono">{event.terminal} (IP: {event.ip})</div>
          </div>

          {event.supervisorAutorizo ? (
            <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                <KeyRound className="size-3 text-amber-400" /> Autorizado por PIN de Supervisor
              </span>
              <div className="font-bold text-amber-300">{event.supervisorAutorizo}</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="size-3" /> PIN Válido Verificado
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">Autorización</span>
              <div className="text-slate-400">Operación estándar de rol</div>
            </div>
          )}
        </div>

        {/* Narrative Description */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">
            Descripción Detallada del Evento
          </span>
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
            {event.detalles}
          </div>
        </div>

        {/* Payload / Raw Data Inspector */}
        {event.payload && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <FileCode2 className="size-3.5 text-blue-400" /> Payload Estructurado (JSON Inmutable)
            </span>
            <pre className="p-3 rounded-2xl bg-black/60 border border-slate-800/80 text-[11px] font-mono text-emerald-400 overflow-x-auto">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

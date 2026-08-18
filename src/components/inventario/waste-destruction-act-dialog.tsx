"use client";

import {
  Printer,
  FileText,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Share2,
  MessageSquare,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { WasteRecord } from "@/actions/waste-actions";

interface WasteDestructionActDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: WasteRecord | null;
}

export function WasteDestructionActDialog({
  isOpen,
  onClose,
  record,
}: WasteDestructionActDialogProps) {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = `*ACTA DE DESMEDRO Y DESTRUCCIÓN TRIBUTARIA - SUNAT*\n` +
      `📌 *N° Acta:* ${record.codigoActa}\n` +
      `📅 *Fecha:* ${record.fecha} ${record.hora}\n` +
      `🏢 *Sucursal:* ${record.sucursal}\n` +
      `⚠️ *Motivo:* ${record.motivo}\n` +
      `💰 *Costo Total de Pérdida:* ${formatCurrency(record.costoTotalPerdida)}\n` +
      `📋 *Estado:* ${record.estado}\n` +
      `⚖️ *Notario / Sustento:* ${record.notarioColegiado}\n\n` +
      `_Documento sustentatorio conforme al Art. 37° Inc. f de la Ley del Impuesto a la Renta._`;

    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank");
    toast.success("Abriendo WhatsApp para compartir acta tributaria.");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Scale className="size-5 text-amber-400" /> Acta de Desmedro & Destrucción Tributaria
            </h3>
            <p className="text-xs text-slate-400 font-mono">{record.codigoActa}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageSquare className="size-3.5" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Printer className="size-3.5" /> Imprimir Acta A4
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div
          id="printable-waste-act"
          className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-5 text-xs text-slate-200"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-base font-black text-white">NOVAMARKET SUPERMERCADOS S.A.C.</span>
              <div className="text-[11px] text-slate-400 font-mono">RUC: 20608945123 • Almacén Central de Merma</div>
              <div className="text-[11px] text-slate-400">Av. El Polo 670, Santiago de Surco, Lima</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-right min-w-44">
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold border border-amber-800 text-[10px] block">
                ACTA DE DESTRUCCIÓN
              </span>
              <strong className="text-sm text-white font-mono block mt-1">{record.codigoActa}</strong>
              <div className="text-[10px] text-slate-400 font-mono">
                {record.fecha} • {record.hora}
              </div>
            </div>
          </div>

          {/* Legal Reference & Motive */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 leading-relaxed">
            <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider block">
              BASE LEGAL TRIBUTARIA (SUNAT):
            </span>
            <p className="text-slate-300 text-[11px]">
              El presente acto se formula en cumplimiento del <strong>Inciso f) del Artículo 37° del TUO de la Ley del Impuesto a la Renta</strong> (D.S. N° 179-2004-EF) y el <strong>Artículo 21° Inciso c) de su Reglamento</strong>, acreditando la destrucción / desmedro físico de existencias no aptas para el consumo o comercialización.
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">CAUSA / MOTIVO DE BAJA:</span>
              <strong className="text-white text-xs">{record.motivo.replace("_", " ")}</strong>
              <div className="text-[11px] text-slate-400 mt-1">
                Lugar: <span className="text-slate-300">{record.lugarDestruccion}</span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">MÉTODO DE DESTRUCCIÓN / DISPOSICIÓN:</span>
              <div className="text-slate-300 text-[11px] font-medium">{record.metodoDestruccion}</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Notario / Interviniente: {record.notarioColegiado}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Inventario de Bienes Destruidos / Desmedrados:
            </span>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">SKU / Ítem</th>
                    <th className="py-2.5 px-3">Lote & Vence</th>
                    <th className="py-2.5 px-3 text-right">Cant. Destruida</th>
                    <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                    <th className="py-2.5 px-3 text-right">Pérdida Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {record.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3">
                        <div className="text-white font-sans font-bold">{item.nombre}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <div>{item.lote || "N/A"}</div>
                        <span className="text-[10px] text-slate-500">{item.fechaVencimiento || "N/A"}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {item.cantidad} {item.unidad}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {formatCurrency(item.costoUnit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400">
                        {formatCurrency(item.costoTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900/80 font-bold border-t border-slate-800">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-white uppercase text-xs">
                      Costo Total de Desmedro / Merma Deducible:
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm text-rose-400 font-mono font-black">
                      {formatCurrency(record.costoTotalPerdida)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observations */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-300">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">OBSERVACIONES TÉCNICAS:</span>
            <p className="mt-0.5">{record.observaciones}</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-[10px] text-slate-400">
            <div className="border-t border-slate-700 pt-2 space-y-0.5">
              <div className="font-bold text-white">{record.responsable}</div>
              <div>Supervisor de Almacén & Calidad</div>
            </div>
            <div className="border-t border-slate-700 pt-2 space-y-0.5">
              <div className="font-bold text-white">CPCC. Roberto Méndez</div>
              <div>Gerente de Operaciones / Contador</div>
            </div>
            <div className="border-t border-slate-700 pt-2 space-y-0.5">
              <div className="font-bold text-white">{record.notarioColegiado}</div>
              <div>Notario Público / Inspector SUNAT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

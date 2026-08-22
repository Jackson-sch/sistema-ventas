"use client";

import { useState } from "react";
import {
  FileCheck2,
  FileX2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Calendar,
  Layers,
  Receipt,
  ShieldCheck,
  Hash,
  X,
  Code2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SunatBatchItem } from "@/actions/sunat-batch-actions";

interface SunatBatchDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  batch: SunatBatchItem | null;
}

export function SunatBatchDetailDialog({
  isOpen,
  onClose,
  batch,
}: SunatBatchDetailDialogProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "xml">("summary");

  if (!isOpen || !batch) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(batch.hashSunat);
    setCopiedHash(true);
    toast.success("Firma Hash SUNAT copiada al portapapeles.");
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<${batch.tipo === "RC" ? "SummaryDocuments" : "VoidedDocuments"} xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:${batch.tipo === "RC" ? "SummaryDocuments-1" : "VoidedDocuments-1"}">
    <cbc:ID>${batch.identificador}</cbc:ID>
    <cbc:ReferenceDate>${batch.fechaReferencia}</cbc:ReferenceDate>
    <cbc:IssueDate>${batch.fechaEnvio.split(" ")[0]}</cbc:IssueDate>
    <cac:Signature>
        <cbc:ID>20608945123</cbc:ID>
        <ds:DigestValue>${batch.hashSunat}</ds:DigestValue>
    </cac:Signature>
    <!-- Ticket SUNAT: ${batch.ticketSunat} -->
    <!-- Total Comprobantes: ${batch.totalComprobantes} -->
</${batch.tipo === "RC" ? "SummaryDocuments" : "VoidedDocuments"}>`;

    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.identificador}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Archivo ${batch.identificador}.xml descargado.`);
  };

  const handleDownloadCdr = () => {
    const cdrContent = `SUNAT CONSTANCIA DE RECEPCION (CDR)
Lote: ${batch.identificador}
Tipo: ${batch.tipo === "RC" ? "Resumen Diario de Boletas" : "Comunicacion de Bajas"}
Ticket: ${batch.ticketSunat}
Estado: ${batch.estadoSunat}
Mensaje: ${batch.mensajeCdr}
Firma Hash: ${batch.hashSunat}
Fecha de Aceptacion: ${batch.fechaEnvio}
Emisor: 20608945123 - NOVAMARKET SUPERMERCADOS S.A.C.`;

    const blob = new Blob([cdrContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CDR-${batch.identificador}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Constancia de Recepción CDR-${batch.identificador}.txt descargada.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 bg-[hsl(224,71%,4%)] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-2xl flex items-center justify-center ${
                batch.tipo === "RC"
                  ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
                  : "bg-rose-600/20 border border-rose-500/30 text-rose-400"
              }`}
            >
              {batch.tipo === "RC" ? <FileCheck2 className="size-5" /> : <FileX2 className="size-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                {batch.identificador}
                <Badge
                  variant="outline"
                  className={`${
                    batch.tipo === "RC"
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                      : "border-rose-500/40 bg-rose-500/10 text-rose-400"
                  } text-[10px] font-mono`}
                >
                  {batch.tipo === "RC" ? "Resumen Diario Boletas" : "Comunicación de Bajas"}
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">
                Lote de transmisión fiscal validado y registrado ante SUNAT SEE-SOL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "summary"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="size-3.5" /> Ficha Técnica SUNAT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("xml")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "xml"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="size-3.5" /> Estructura XML UBL 2.1
          </button>
        </div>

        {activeTab === "summary" ? (
          <div className="space-y-4">
            {/* Status Alert */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-300">
                  Respuesta SUNAT: {batch.estadoSunat}
                </div>
                <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {batch.mensajeCdr}
                </div>
              </div>
            </div>

            {/* Main Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Ticket SUNAT
                </span>
                <span className="text-xs font-mono font-bold text-white block truncate">
                  {batch.ticketSunat}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Fecha Referencia
                </span>
                <span className="text-xs font-mono font-bold text-slate-200 block">
                  {batch.fechaReferencia}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Fecha Envío
                </span>
                <span className="text-[11px] font-medium text-slate-300 block truncate">
                  {batch.fechaEnvio}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Comprobantes
                </span>
                <span className="text-xs font-mono font-bold text-blue-400 block">
                  {batch.totalComprobantes} CPEs
                </span>
              </div>
            </div>

            {/* Hash Signature Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-400" /> Firma Digital / Hash SUNAT
                </span>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedHash ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copiedHash ? "Copiado" : "Copiar Hash"}
                </button>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 break-all">
                {batch.hashSunat}
              </div>
            </div>

            {/* Total Amount if available */}
            {batch.montoTotal !== undefined && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
                <span className="text-slate-400 font-sans font-bold">Monto Total Agrupado:</span>
                <span className="text-base font-black text-emerald-400">
                  {formatCurrency(batch.montoTotal)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-64 overflow-y-auto leading-relaxed">
              <pre className="whitespace-pre-wrap">
{`<?xml version="1.0" encoding="UTF-8"?>
<${batch.tipo === "RC" ? "SummaryDocuments" : "VoidedDocuments"} xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:${batch.tipo === "RC" ? "SummaryDocuments-1" : "VoidedDocuments-1"}">
    <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
    <cbc:CustomizationID>1.1</cbc:CustomizationID>
    <cbc:ID>${batch.identificador}</cbc:ID>
    <cbc:ReferenceDate>${batch.fechaReferencia}</cbc:ReferenceDate>
    <cbc:IssueDate>${batch.fechaEnvio.split(" ")[0]}</cbc:IssueDate>
    <cac:Signature>
        <cbc:ID>20608945123</cbc:ID>
        <cac:SignatoryParty>
            <cac:PartyName>
                <cbc:Name>NOVAMARKET SUPERMERCADOS S.A.C.</cbc:Name>
            </cac:PartyName>
        </cac:SignatoryParty>
        <cac:DigitalSignatureAttachment>
            <cac:ExternalReference>
                <cbc:URI>#Signature-NovaMarket</cbc:URI>
            </cac:ExternalReference>
        </cac:DigitalSignatureAttachment>
    </cac:Signature>
    <ds:DigestValue>${batch.hashSunat}</ds:DigestValue>
</${batch.tipo === "RC" ? "SummaryDocuments" : "VoidedDocuments"}>`}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadXml}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="size-3.5 text-blue-400" /> Descargar XML Firmado
            </button>
            <button
              type="button"
              onClick={handleDownloadCdr}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Receipt className="size-3.5 text-emerald-400" /> Descargar CDR SUNAT
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

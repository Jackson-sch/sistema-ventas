"use client";

import { useState } from "react";
import {
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Transaction {
  id: string;
  serialNumber: string;
  docType: "Boleta" | "Factura";
  customer: string;
  paymentMethod: "efectivo" | "tarjeta" | "yape" | "plin";
  cashier: string;
  total: number;
  time: string;
  sunatStatus: "aceptado" | "enviado" | "pendiente";
}

const FALLBACK_TRANSACTIONS: Transaction[] = [
  { id: "1", serialNumber: "B001-00042918", docType: "Boleta", customer: "Clientes Varios", paymentMethod: "efectivo", cashier: "Carlos Alarcón", total: 42.50, time: "11:42:15", sunatStatus: "aceptado" },
  { id: "2", serialNumber: "B001-00042917", docType: "Boleta", customer: "Juan Pérez (DNI 45892144)", paymentMethod: "yape", cashier: "Carlos Alarcón", total: 88.20, time: "11:35:02", sunatStatus: "aceptado" },
  { id: "3", serialNumber: "F001-00001204", docType: "Factura", customer: "Inversiones Retail SAC (RUC 20601234567)", paymentMethod: "tarjeta", cashier: "María Gómez", total: 345.00, time: "11:15:40", sunatStatus: "aceptado" },
  { id: "4", serialNumber: "B001-00042916", docType: "Boleta", customer: "Clientes Varios", paymentMethod: "efectivo", cashier: "Carlos Alarcón", total: 15.60, time: "10:58:19", sunatStatus: "aceptado" },
  { id: "5", serialNumber: "B001-00042915", docType: "Boleta", customer: "Ana Torres (DNI 72109845)", paymentMethod: "plin", cashier: "María Gómez", total: 64.90, time: "10:42:01", sunatStatus: "enviado" },
  { id: "6", serialNumber: "B001-00042914", docType: "Boleta", customer: "Clientes Varios", paymentMethod: "tarjeta", cashier: "Terminal Auto 01", total: 112.30, time: "10:30:11", sunatStatus: "aceptado" },
];

export function RecentTransactionsTable({ data }: { data?: Transaction[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDoc, setFilterDoc] = useState<string>("all");

  const TRANSACTIONS = data && data.length > 0 ? data : FALLBACK_TRANSACTIONS;

  const filtered = TRANSACTIONS.filter((t) => {
    const matchesSearch =
      t.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cashier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDoc = filterDoc === "all" || t.docType.toLowerCase() === filterDoc.toLowerCase();
    return matchesSearch && matchesDoc;
  });

  const handlePrint = (serial: string) => {
    toast.success(`Enviando a impresora térmica: ${serial}`);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="size-4 text-blue-400" /> Monitor Transaccional & Facturación SUNAT
          </h3>
          <p className="text-xs text-slate-400">Comprobantes emitidos en tiempo real por los terminales de caja</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar serie, RUC, cliente..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterDoc("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterDoc === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterDoc("boleta")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterDoc === "boleta" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Boletas
            </button>
            <button
              onClick={() => setFilterDoc("factura")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterDoc === "factura" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Facturas
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Comprobante</th>
              <th className="py-3 px-4">Cliente / Razón Social</th>
              <th className="py-3 px-4 text-center">Medio de Pago</th>
              <th className="py-3 px-4 text-center">Cajero / Caja</th>
              <th className="py-3 px-4 text-center">Hora</th>
              <th className="py-3 px-4 text-center">Estado SUNAT</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
            {filtered.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-mono font-bold text-white text-xs">{tx.serialNumber}</div>
                  <div className="text-[10px] text-blue-400 font-sans">{tx.docType} Electrónica</div>
                </td>
                <td className="py-3 px-4 text-slate-300 max-w-[220px] truncate">
                  {tx.customer}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    {tx.paymentMethod === "efectivo" && <Banknote className="size-3 text-emerald-400" />}
                    {tx.paymentMethod === "tarjeta" && <CreditCard className="size-3 text-blue-400" />}
                    {(tx.paymentMethod === "yape" || tx.paymentMethod === "plin") && <QrCode className="size-3 text-purple-400" />}
                    <span className="capitalize">{tx.paymentMethod}</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-slate-300">
                  {tx.cashier}
                </td>
                <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                  {tx.time}
                </td>
                <td className="py-3 px-4 text-center">
                  {tx.sunatStatus === "aceptado" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      <CheckCircle2 className="size-3" /> Aceptado
                    </span>
                  )}
                  {tx.sunatStatus === "enviado" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                      <Clock className="size-3" /> Enviado
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                  {formatCurrency(tx.total)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handlePrint(tx.serialNumber)}
                    title="Imprimir ticket térmico"
                    className="p-1.5 rounded-lg bg-slate-800/70 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                  >
                    <Printer className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

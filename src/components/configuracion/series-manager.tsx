"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Printer,
  Sparkles,
  RefreshCw,
  Info,
  Layers,
  Building2,
  Hash,
  ArrowRight,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  SerieItem,
  getSeriesComprobantesData,
  saveSerieComprobanteAction,
  toggleSerieStatusAction,
  SaveSerieInput,
} from "@/actions/series-actions";

export function SeriesManager() {
  const [series, setSeries] = useState<SerieItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSerie, setEditingSerie] = useState<SerieItem | null>(null);

  // Form State
  const [formTipo, setFormTipo] = useState("03");
  const [formTipoNombre, setFormTipoNombre] = useState("Boleta de Venta Electrónica");
  const [formSerie, setFormSerie] = useState("B002");
  const [formCorrelativoActual, setFormCorrelativoActual] = useState("0");
  const [formCorrelativoInicial, setFormCorrelativoInicial] = useState("1");
  const [formFormato, setFormFormato] = useState("ticket_80mm");
  const [formEsPrincipal, setFormEsPrincipal] = useState(false);
  const [formActivo, setFormActivo] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSeries = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const data = await getSeriesComprobantesData();
      setSeries(data);
      if (showToast) {
        toast.success(`Series actualizadas: ${data.length} series registradas.`);
      }
    } catch (err) {
      console.error("Error al cargar series:", err);
      if (showToast) toast.error("Error al cargar series.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const handleTipoChange = (val: string) => {
    setFormTipo(val);
    switch (val) {
      case "01":
        setFormTipoNombre("Factura Electrónica");
        if (!editingSerie) setFormSerie("F002");
        break;
      case "03":
        setFormTipoNombre("Boleta de Venta Electrónica");
        if (!editingSerie) setFormSerie("B002");
        break;
      case "07":
        setFormTipoNombre("Nota de Crédito Electrónica");
        if (!editingSerie) setFormSerie("BC02");
        break;
      case "08":
        setFormTipoNombre("Nota de Débito Electrónica");
        if (!editingSerie) setFormSerie("BD02");
        break;
      case "09":
        setFormTipoNombre("Guía de Remisión Remitente");
        if (!editingSerie) setFormSerie("T002");
        break;
      case "COT":
        setFormTipoNombre("Cotización / Proforma");
        if (!editingSerie) setFormSerie("COT2");
        break;
    }
  };

  const handleOpenCreate = () => {
    setEditingSerie(null);
    setFormTipo("03");
    setFormTipoNombre("Boleta de Venta Electrónica");
    setFormSerie("B002");
    setFormCorrelativoActual("0");
    setFormCorrelativoInicial("1");
    setFormFormato("ticket_80mm");
    setFormEsPrincipal(false);
    setFormActivo(true);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: SerieItem) => {
    setEditingSerie(item);
    setFormTipo(item.tipoComprobante);
    setFormTipoNombre(item.tipoNombre);
    setFormSerie(item.serie);
    setFormCorrelativoActual(item.correlativoActual.toString());
    setFormCorrelativoInicial(item.correlativoInicial.toString());
    setFormFormato(item.formato);
    setFormEsPrincipal(item.esPrincipal);
    setFormActivo(item.activo);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const curr = parseInt(formCorrelativoActual, 10);
    const init = parseInt(formCorrelativoInicial, 10);

    if (isNaN(curr) || curr < 0) {
      toast.error("El correlativo actual debe ser un número entero mayor o igual a 0.");
      return;
    }

    if (formSerie.trim().length !== 4) {
      toast.error("La serie debe tener exactamente 4 caracteres alfanuméricos (ej: F001, B001).");
      return;
    }

    setIsSaving(true);
    try {
      const payload: SaveSerieInput = {
        id: editingSerie ? editingSerie.id : undefined,
        tipoComprobante: formTipo,
        tipoNombre: formTipoNombre,
        serie: formSerie.trim().toUpperCase(),
        correlativoActual: curr,
        correlativoInicial: isNaN(init) ? 1 : init,
        formato: formFormato,
        esPrincipal: formEsPrincipal,
        activo: formActivo,
      };

      const res = await saveSerieComprobanteAction(payload);
      if (res.success) {
        toast.success(
          editingSerie
            ? `Serie ${payload.serie} actualizada con correlativo en ${curr}.`
            : `Nueva serie ${payload.serie} creada exitosamente.`
        );
        setIsDialogOpen(false);
        await loadSeries();
      } else {
        toast.error(res.error || "Error al guardar serie.");
      }
    } catch {
      toast.error("Error al procesar la solicitud.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item: SerieItem) => {
    const newStatus = !item.activo;
    try {
      const res = await toggleSerieStatusAction(item.id, newStatus);
      if (res.success) {
        setSeries((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, activo: newStatus } : s))
        );
        toast.success(`Serie ${item.serie} ${newStatus ? "activada" : "desactivada"}.`);
      } else {
        toast.error(res.error || "Error al actualizar estado");
      }
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  // KPIs
  const boletaPrincipal = series.find((s) => s.tipoComprobante === "03" && s.esPrincipal) || series.find((s) => s.tipoComprobante === "03");
  const facturaPrincipal = series.find((s) => s.tipoComprobante === "01" && s.esPrincipal) || series.find((s) => s.tipoComprobante === "01");
  const ncPrincipal = series.find((s) => s.tipoComprobante === "07" && s.esPrincipal) || series.find((s) => s.tipoComprobante === "07");

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Boletas */}
        <div className="glass-panel rounded-2xl p-4 border border-blue-500/20 bg-blue-950/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-blue-400">Boletas de Venta (03)</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {boletaPrincipal ? `${boletaPrincipal.serie}-${(boletaPrincipal.correlativoActual + 1).toString().padStart(8, "0")}` : "B001-00000001"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Último emitido: <strong className="text-slate-200">{boletaPrincipal?.correlativoActual || 0}</strong>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <FileText className="size-5" />
          </div>
        </div>

        {/* Facturas */}
        <div className="glass-panel rounded-2xl p-4 border border-purple-500/20 bg-purple-950/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-purple-400">Facturas Electrónicas (01)</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {facturaPrincipal ? `${facturaPrincipal.serie}-${(facturaPrincipal.correlativoActual + 1).toString().padStart(8, "0")}` : "F001-00000001"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Último emitido: <strong className="text-slate-200">{facturaPrincipal?.correlativoActual || 0}</strong>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <FileText className="size-5" />
          </div>
        </div>

        {/* Notas de Crédito */}
        <div className="glass-panel rounded-2xl p-4 border border-amber-500/20 bg-amber-950/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-amber-400">Notas de Crédito (07)</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {ncPrincipal ? `${ncPrincipal.serie}-${(ncPrincipal.correlativoActual + 1).toString().padStart(8, "0")}` : "BC01-00000001"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Último emitido: <strong className="text-slate-200">{ncPrincipal?.correlativoActual || 0}</strong>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <FileText className="size-5" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Hash className="size-5 text-blue-400" /> Series y Correlativos de Facturación
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configura el correlativo de inicio de cada tipo de comprobante para continuar tu facturación SUNAT sin saltos.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadSeries(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="size-3.5" /> Nueva Serie
          </button>
        </div>
      </div>

      {/* Series Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Tipo Comprobante</th>
              <th className="py-3.5 px-4 text-center">Serie</th>
              <th className="py-3.5 px-4 text-right">Último Emitido</th>
              <th className="py-3.5 px-4 text-right">Próximo Correlativo</th>
              <th className="py-3.5 px-4 text-center">Formato</th>
              <th className="py-3.5 px-4 text-center">Asignación</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`serie-skel-${idx}`} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 w-44 bg-slate-800 rounded"></div></td>
                  <td className="py-4 px-4 text-center"><div className="h-5 w-14 bg-slate-800 rounded mx-auto"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-16 bg-slate-800 rounded ml-auto"></div></td>
                  <td className="py-4 px-4 text-right"><div className="h-4 w-24 bg-slate-800 rounded ml-auto"></div></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 w-20 bg-slate-800 rounded mx-auto"></div></td>
                  <td className="py-4 px-4 text-center"><div className="h-4 w-20 bg-slate-800 rounded mx-auto"></div></td>
                  <td className="py-4 px-4 text-center"><div className="h-5 w-16 bg-slate-800 rounded-full mx-auto"></div></td>
                  <td className="py-4 px-4 text-center"><div className="h-7 w-16 bg-slate-800 rounded mx-auto"></div></td>
                </tr>
              ))
            ) : series.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <FileText className="size-10 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">No hay series configuradas</p>
                  <p className="text-xs text-slate-600">Crea series para Boletas, Facturas y Notas de Crédito</p>
                </td>
              </tr>
            ) : (
              series.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono font-bold ${
                          item.tipoComprobante === "01"
                            ? "border-purple-500/40 bg-purple-950/40 text-purple-300"
                            : item.tipoComprobante === "03"
                            ? "border-blue-500/40 bg-blue-950/40 text-blue-300"
                            : item.tipoComprobante === "07"
                            ? "border-amber-500/40 bg-amber-950/40 text-amber-300"
                            : "border-slate-700 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {item.tipoComprobante}
                      </Badge>
                      <div>
                        <div className="font-bold text-white text-xs">{item.tipoNombre}</div>
                        {item.esPrincipal && (
                          <span className="text-[10px] text-emerald-400 font-medium">★ Serie Principal</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-white text-xs">
                      {item.serie}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300 text-xs">
                    {item.correlativoActual.toLocaleString("en-US")}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-mono font-extrabold text-emerald-400 text-xs bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      {item.serie}-{(item.correlativoActual + 1).toString().padStart(8, "0")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 text-[10px] font-medium border border-slate-700/50">
                      {item.formato === "ticket_80mm" ? "Ticket 80mm" : item.formato === "ticket_58mm" ? "Ticket 58mm" : "Hoja A4"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-400 text-[11px]">
                    {item.sucursalNombre || "Todas las sedes"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggle(item)}
                      className="inline-flex items-center gap-1 transition-opacity hover:opacity-80"
                      title={item.activo ? "Desactivar serie" : "Activar serie"}
                    >
                      {item.activo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="size-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Inactivo
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                      title="Editar correlativo y configuración"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar Serie */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Hash className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingSerie ? `Editar Serie ${editingSerie.serie}` : "Nueva Serie de Facturación"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ajuste de numeración correlativa y parámetros tributarios SUNAT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Tipo de Comprobante */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Tipo de Documento Tributario
                </label>
                <select
                  value={formTipo}
                  onChange={(e) => handleTipoChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="03">03 - Boleta de Venta Electrónica</option>
                  <option value="01">01 - Factura Electrónica</option>
                  <option value="07">07 - Nota de Crédito</option>
                  <option value="08">08 - Nota de Débito</option>
                  <option value="09">09 - Guía de Remisión Remitente</option>
                  <option value="COT">COT - Cotización / Proforma</option>
                </select>
              </div>

              {/* Serie & Formato */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Serie (4 Caracteres)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formSerie}
                    onChange={(e) => setFormSerie(e.target.value.toUpperCase())}
                    placeholder="B001, F001..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Facturas con F, Boletas con B</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Formato de Impresión
                  </label>
                  <select
                    value={formFormato}
                    onChange={(e) => setFormFormato(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ticket_80mm">Ticket Térmico 80mm</option>
                    <option value="ticket_58mm">Ticket Térmico 58mm</option>
                    <option value="a4">Hoja Completa A4</option>
                    <option value="a5">Media Hoja A5</option>
                  </select>
                </div>
              </div>

              {/* Correlativo Actual / Siguiente */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-blue-400" /> Último Correlativo Emitido
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Próximo: <strong className="text-emerald-400">{formSerie}-{((parseInt(formCorrelativoActual, 10) || 0) + 1).toString().padStart(8, "0")}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formCorrelativoActual}
                  onChange={(e) => setFormCorrelativoActual(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 42991"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Ingresa el último número emitido. La siguiente venta se emitirá automáticamente con el número <strong className="text-white">{(parseInt(formCorrelativoActual, 10) || 0) + 1}</strong>.
                </p>
              </div>

              {/* Opciones booleanas */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-semibold text-white">Serie Principal</div>
                  <div className="text-[11px] text-slate-500">Usar por defecto en cobros rápidos del POS</div>
                </div>
                <input
                  type="checkbox"
                  checked={formEsPrincipal}
                  onChange={(e) => setFormEsPrincipal(e.target.checked)}
                  className="size-4 rounded accent-blue-600"
                />
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  {isSaving ? "Guardando..." : "Guardar Serie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

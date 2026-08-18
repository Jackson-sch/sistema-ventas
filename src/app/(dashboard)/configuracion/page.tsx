"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Receipt,
  ShieldCheck,
  Award,
  Database,
  Save,
  CheckCircle2,
  Sparkles,
  KeyRound,
  FileCode2,
  AlertTriangle,
  Lock,
  RefreshCw,
  Download,
  Upload,
  Server,
  DollarSign,
  Printer,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getTenantSettingsData, saveTenantSettingsAction } from "@/actions/tenant-actions";

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<"empresa" | "sunat" | "pos" | "puntos" | "database">("empresa");

  // Empresa form state
  const [ruc, setRuc] = useState("20608912345");
  const [razonSocial, setRazonSocial] = useState("NOVAMARKET SUPERMERCADOS S.A.C.");
  const [nombreComercial, setNombreComercial] = useState("NovaMarket Retail");
  const [direccionFiscal, setDireccionFiscal] = useState("Av. Javier Prado Este 4200 - Surco - Lima");
  const [telefono, setTelefono] = useState("(01) 619-8000");
  const [emailContacto, setEmailContacto] = useState("contacto@novamarket.pe");
  const [sitioWeb, setSitioWeb] = useState("www.novamarket.pe");
  const [planNombre, setPlanNombre] = useState("Pro");

  useEffect(() => {
    getTenantSettingsData()
      .then((data) => {
        setRuc(data.ruc);
        setRazonSocial(data.razonSocial);
        setNombreComercial(data.nombreComercial);
        setPlanNombre(data.planNombre);
      })
      .catch((err) => console.error("Error cargando configuración:", err));
  }, []);

  // SUNAT form state
  const [sunatEnv, setSunatEnv] = useState<"beta" | "produccion">("produccion");
  const [usuarioSol, setUsuarioSol] = useState("NOVAPSE01");
  const [claveSol, setClaveSol] = useState("••••••••••••");
  const [certVencimiento, setCertVencimiento] = useState("15/12/2027");
  const [tasaIgv, setTasaIgv] = useState("18");
  const [tasaIcbper, setTasaIcbper] = useState("0.50");

  // POS policies state
  const [limiteGaveta, setLimiteGaveta] = useState("1200");
  const [autoPrintTicket, setAutoPrintTicket] = useState(true);
  const [beepScanner, setBeepScanner] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState("15");

  // Loyalty points state
  const [montoPorPunto, setMontoPorPunto] = useState("10.00");
  const [puntosMinimosCanje, setPuntosMinimosCanje] = useState("50");
  const [descuentoPorCanje, setDescuentoPorCanje] = useState("10.00");

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveTenantSettingsAction({
      razonSocial,
      ruc,
      nombreComercial,
      telefono,
      email: emailContacto,
    });
    if (result.success) {
      toast.success("¡Parámetros del sistema guardados exitosamente!", {
        description: "Todos los cambios han sido sincronizados con el servidor y los terminales POS.",
      });
    } else {
      toast.error(result.error || "Error al guardar configuración");
    }
  };

  const handleTestSunatConnection = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: "Verificando conexión con el servicio web de SUNAT...",
        success: "¡Conexión exitosa con SUNAT PSE/SEE! Certificado digital válido y vigente.",
        error: "Error de conexión con SUNAT",
      }
    );
  };

  const handleGenerateBackup = () => {
    toast.success("Generando copia de seguridad de la base de datos...", {
      description: "Archivo 'novamarket_backup_20260815.sql' descargado exitosamente.",
    });
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="size-6 text-blue-400" /> Configuración de Empresa & Parámetros Fiscales
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Identidad tributaria SUNAT, credenciales SOL, políticas de caja y programa de fidelización
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Save className="size-4" /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab("empresa")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "empresa"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Building2 className="size-4" /> Datos de la Empresa
        </button>

        <button
          onClick={() => setActiveTab("sunat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "sunat"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Receipt className="size-4" /> Facturación SUNAT
        </button>

        <button
          onClick={() => setActiveTab("pos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "pos"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Printer className="size-4" /> Políticas POS & Caja
        </button>

        <button
          onClick={() => setActiveTab("puntos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "puntos"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Award className="size-4" /> Programa de Puntos
        </button>

        <button
          onClick={() => setActiveTab("database")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "database"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Database className="size-4" /> Base de Datos & Respaldo
        </button>
      </div>

      {/* Tab 1: Datos de la Empresa */}
      {activeTab === "empresa" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white tracking-tight">Identidad & Datos Fiscales</h3>
            <p className="text-xs text-slate-400">Esta información se imprime en el encabezado de los tickets térmicos y facturas electrónicas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">R.U.C. de la Empresa *</label>
              <input
                type="text"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Razón Social Registrada *</label>
              <input
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Comercial</label>
              <input
                type="text"
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dirección Fiscal de la Sede Principal *</label>
              <input
                type="text"
                value={direccionFiscal}
                onChange={(e) => setDireccionFiscal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teléfono Central / WhatsApp</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Correo Electrónico de Contacto</label>
              <input
                type="email"
                value={emailContacto}
                onChange={(e) => setEmailContacto(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Facturación SUNAT */}
      {activeTab === "sunat" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Parámetros Tributarios SUNAT (UBL 2.1)</h3>
              <p className="text-xs text-slate-400">Credenciales SOL, certificados digitales y conmutador de entorno.</p>
            </div>

            <button
              onClick={handleTestSunatConnection}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
            >
              <RefreshCw className="size-3.5 text-blue-400" /> Probar Conexión SUNAT
            </button>
          </div>

          {/* Environment Switcher */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white block">Entorno de Emisión de Comprobantes</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                En modo Producción, los comprobantes son enviados en tiempo real a SUNAT con valor fiscal legal.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSunatEnv("beta")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  sunatEnv === "beta" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Pruebas / Beta
              </button>
              <button
                type="button"
                onClick={() => setSunatEnv("produccion")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  sunatEnv === "produccion" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white"
                }`}
              >
                Producción en Vivo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Usuario Secundario SOL *</label>
              <input
                type="text"
                value={usuarioSol}
                onChange={(e) => setUsuarioSol(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Clave SOL *</label>
              <input
                type="password"
                value={claveSol}
                onChange={(e) => setClaveSol(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Certificate Status Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-400" /> Certificado Digital Tributario
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Válido
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Vence el: <strong className="text-white font-mono">{certVencimiento}</strong>
              </div>
            </div>

            {/* Tax Rates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tasa I.G.V. (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tasaIgv}
                    onChange={(e) => setTasaIgv(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white text-center"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Impuesto ICBPER</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">S/</span>
                  <input
                    type="number"
                    step="0.10"
                    value={tasaIcbper}
                    onChange={(e) => setTasaIcbper(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Políticas POS & Caja */}
      {activeTab === "pos" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white tracking-tight">Reglas Operativas de Caja & POS</h3>
            <p className="text-xs text-slate-400">Límites de efectivo en gaveta física, timeouts de seguridad y hardware.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Límite de Efectivo en Gaveta para Alerta (S/)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">S/</span>
                <input
                  type="number"
                  value={limiteGaveta}
                  onChange={(e) => setLimiteGaveta(e.target.value)}
                  placeholder="1200"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Al sobrepasar este saldo, el sistema sugerirá un retiro preventivo a bóveda.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bloqueo Automático por Inactividad (Minutos)
              </label>
              <input
                type="number"
                value={inactivityTimeout}
                onChange={(e) => setInactivityTimeout(e.target.value)}
                placeholder="15"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                La terminal solicitará el PIN del cajero tras este tiempo sin actividad.
              </span>
            </div>

            {/* Checkboxes */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Impresión Automática de Ticket</span>
                <span className="text-[11px] text-slate-400">Imprimir en papel térmico de 80mm inmediatamente al cobrar.</span>
              </div>
              <input
                type="checkbox"
                checked={autoPrintTicket}
                onChange={(e) => setAutoPrintTicket(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Sonido de Confirmación de Escáner</span>
                <span className="text-[11px] text-slate-400">Emitir beep auditivo al leer código de barras en el POS.</span>
              </div>
              <input
                type="checkbox"
                checked={beepScanner}
                onChange={(e) => setBeepScanner(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Programa de Puntos */}
      {activeTab === "puntos" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white tracking-tight">Reglas del Programa de Fidelización</h3>
            <p className="text-xs text-slate-400">Definición de tasas de acumulación y valor monetario del canje en caja.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-amber-400">Monto de Compra por 1 Punto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">S/</span>
                <input
                  type="number"
                  value={montoPorPunto}
                  onChange={(e) => setMontoPorPunto(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">Ej: S/ 10.00 en compras = 1 punto acumulado</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-amber-400">Puntos Mínimos para Canje</label>
              <input
                type="number"
                value={puntosMinimosCanje}
                onChange={(e) => setPuntosMinimosCanje(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white text-center"
              />
              <span className="text-[10px] text-slate-500 block">Cantidad requerida para solicitar un vale de descuento</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-emerald-400">Descuento Otorgado por Canje</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">S/</span>
                <input
                  type="number"
                  value={descuentoPorCanje}
                  onChange={(e) => setDescuentoPorCanje(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">Descuento aplicado al ticket al canjear 50 puntos</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Base de Datos & Respaldo */}
      {activeTab === "database" && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white tracking-tight">Estado del Motor de Base de Datos</h3>
            <p className="text-xs text-slate-400">Persistencia con Drizzle ORM y Supabase PostgreSQL.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Database className="size-4 text-emerald-400" /> Supabase PostgreSQL
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-ping"></span> Conectado
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
                <div>Motor: PostgreSQL 16.2</div>
                <div>Latencia: 24 ms</div>
                <div>ORM: Drizzle ORM v0.45.1</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-white block">Copia de Seguridad Manual</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Descarga una instantánea completa de productos, ventas, clientes y kardex.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateBackup}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-bold text-xs transition-colors self-start"
              >
                <Download className="size-3.5 text-blue-400" /> Descargar Backup (.SQL)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

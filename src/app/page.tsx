import Link from "next/link";
import {
  ShoppingCart,
  Package,
  BarChart3,
  ShieldCheck,
  Zap,
  Store,
  ArrowRight,
  Receipt,
  Users2,
  Settings,
  Archive,
  Layers,
  Sparkles,
  QrCode,
  CheckCircle2,
  Building2,
  Lock,
  DollarSign,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[hsl(224,71%,4%)] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[hsl(224,71%,4%)]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-black text-xl group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg tracking-tight">NovaMarket POS</span>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 py-0 font-mono">
                  v2.4 Enterprise
                </Badge>
              </div>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Building2 className="size-3 text-blue-400" /> Supermercados & Retail Multi-Tenant
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <ShoppingCart className="size-3.5" /> Terminal POS
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col items-center text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 animate-in fade-in duration-300">
          <Sparkles className="size-3.5 text-blue-400" />
          <span>Facturación Electrónica SUNAT UBL 2.1 & Supabase PostgreSQL</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-5xl leading-[1.15]">
          Punto de Venta de Alta Velocidad para{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
            Supermercados & Cadenas Retail
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed font-normal">
          Arquitectura multi-sucursal con aislamiento estricto (RLS), terminal táctil con balanza y escáner, arqueos ciegos con PIN de supervisor y Kardex permanente valorado SUNAT.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/pos"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <ShoppingCart className="size-4" /> Abrir Terminal de Cobro (POS) <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-sm transition-all hover:border-slate-700 shadow-md"
          >
            <BarChart3 className="size-4 text-blue-400" /> Dashboard Ejecutivo
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
          >
            <Lock className="size-4" /> Acceso con PIN
          </Link>
        </div>

        {/* Live Terminal Status Bar */}
        <div className="mt-12 p-3 px-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-white">Servicio Web SUNAT:</span> Conectado (Beta/Prod)
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="size-3.5 text-blue-400" />
            <span className="font-semibold text-white">Tiempo de Cobro:</span> &lt; 0.8 segundos
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 text-purple-400" />
            <span className="font-semibold text-white">Auditoría Inmutable:</span> Activa
          </div>
        </div>

        {/* 10 Core Modules Grid */}
        <div className="mt-16 w-full text-left">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Ecosistema Completo de NovaMarket POS</h2>
            <p className="text-xs text-slate-400 mt-1">Todos los módulos integrados y sincronizados con la base de datos PostgreSQL</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Module 1 */}
            <Link
              href="/pos"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="size-5" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  En Vivo
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                Terminal POS & Cobro
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Escáner continuo EAN-13, balanza de peso, calculadora de vueltos, pagos mixtos (Yape/Plin/Efectivo) y arqueo ciego.
              </p>
            </Link>

            {/* Module 2 */}
            <Link
              href="/ventas"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <Receipt className="size-5" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 font-mono">
                  UBL 2.1
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                Facturación SUNAT & Tickets
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Simulador de ticket térmico 80mm ESC/POS, código QR oficial, emisión de Notas de Crédito y descarga XML/CDR.
              </p>
            </Link>

            {/* Module 3 */}
            <Link
              href="/clientes"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <Users2 className="size-5" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                  Puntos
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                Clientes & Fidelización
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Consulta instantánea DNI (Reniec) y RUC (SUNAT), saldo de puntos acumulados, historial de compras y descuentos.
              </p>
            </Link>

            {/* Module 4 */}
            <Link
              href="/inventario"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Package className="size-5" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                Stock, Catálogo & Perecibles
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Control de lotes con fecha de caducidad, cálculo de margen comercial, alertas de stock mínimo y venta pesable.
              </p>
            </Link>

            {/* Module 5 */}
            <Link
              href="/inventario/kardex"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <Archive className="size-5" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 font-mono">
                  SUNAT 13.1
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                Kardex Valorado Ponderado
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Entradas, salidas y saldos físicos valorados bajo el método de Promedio Ponderado Móvil con sustentos contables.
              </p>
            </Link>

            {/* Module 6 */}
            <Link
              href="/dashboard"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <BarChart3 className="size-5" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                Dashboard Ejecutivo
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Ventas del día, monitor de cajas físicas en vivo, margen bruto y ranking de rotación de productos con gráficos Recharts.
              </p>
            </Link>

            {/* Module 7 */}
            <Link
              href="/auditoria"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="size-5" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                Auditoría & Logs de Seguridad
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Trazabilidad inmutable de eventos, retiros a bóveda, autorizaciones con PIN de supervisor y visor de JSON forense.
              </p>
            </Link>

            {/* Module 8 */}
            <Link
              href="/sucursales"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                  <Store className="size-5" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                Sucursales & Cajas Físicas
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Gestión multi-tienda con Código de Establecimiento SUNAT, series de boletas/facturas e impresoras térmicas de red.
              </p>
            </Link>

            {/* Module 9 */}
            <Link
              href="/configuracion"
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700/30 text-slate-300 flex items-center justify-center border border-slate-700/50 group-hover:scale-110 transition-transform">
                  <Settings className="size-5" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                Configuración de Empresa
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Credenciales SOL de SUNAT, Certificado Digital .pfx, switch Beta/Producción, políticas de gaveta y respaldo SQL.
              </p>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              N
            </div>
            <span>NovaMarket Supermercados S.A.C. — R.U.C. 20608912345</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <Link href="/pos" className="hover:text-white transition-colors">Terminal POS</Link>
            <Link href="/ventas" className="hover:text-white transition-colors">Ventas</Link>
            <Link href="/inventario" className="hover:text-white transition-colors">Inventario</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/configuracion" className="hover:text-white transition-colors">Configuración</Link>
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Iniciar Sesión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

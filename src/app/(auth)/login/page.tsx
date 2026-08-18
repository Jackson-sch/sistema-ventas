"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Cpu,
  Receipt,
  Layers,
  HelpCircle,
  Delete,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"cajero" | "admin">("cajero");

  // Cashier PIN state
  const [selectedBranch, setSelectedBranch] = useState("surco");
  const [selectedRegister, setSelectedRegister] = useState("caja-01");
  const [selectedCashier, setSelectedCashier] = useState("carlos");
  const [pin, setPin] = useState("");

  // Admin credentials state
  const [tenantSlug, setTenantSlug] = useState("novamarket");
  const [email, setEmail] = useState("admin@novamarket.pe");
  const [password, setPassword] = useState("admin2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleNumpadClick = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
    }
  };

  const handleNumpadDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleNumpadClear = () => {
    setPin("");
  };

  const handleCashierLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error("Por favor ingresa un PIN de al menos 4 dígitos");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("novamarket_active_role", "cajero");
    }

    setIsLoading(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: "Validando credenciales de terminal POS...",
        success: () => {
          setIsLoading(false);
          router.push("/pos");
          return "¡Turno iniciado con éxito! Redirigiendo a Terminal POS...";
        },
        error: "PIN inválido o caja no asignada",
      }
    );
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    setIsLoading(true);
    const isSuperadmin = email.includes("superadmin");
    const isSupervisor = email.includes("supervisor") || email.includes("maria");
    const selectedRole = isSuperadmin ? "superadmin" : isSupervisor ? "supervisor" : "admin";

    if (typeof window !== "undefined") {
      localStorage.setItem("novamarket_active_role", selectedRole);
    }

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 900)),
      {
        loading: isSuperadmin ? "Autenticando Superadmin SaaS..." : "Autenticando usuario administrador...",
        success: () => {
          setIsLoading(false);
          router.push(isSuperadmin ? "/superadmin" : "/dashboard");
          return isSuperadmin
            ? "¡Acceso concedido a la Consola Global de Superadmin SaaS!"
            : "¡Bienvenido a NovaMarket POS! Accediendo al Panel Ejecutivo...";
        },
        error: "Credenciales incorrectas",
      }
    );
  };

  const setDemoProfile = (role: "cajero" | "supervisor" | "admin" | "superadmin") => {
    if (role === "cajero") {
      setLoginMode("cajero");
      setSelectedBranch("surco");
      setSelectedRegister("caja-01");
      setSelectedCashier("carlos");
      setPin("4821");
      toast.info("Perfil autocompletado: Carlos Alarcón (Caja 01 - PIN 4821)");
    } else if (role === "supervisor") {
      setLoginMode("cajero");
      setSelectedBranch("surco");
      setSelectedRegister("caja-02");
      setSelectedCashier("marcos");
      setPin("7741");
      toast.info("Perfil autocompletado: Marcos Ramos (Supervisor - PIN 7741)");
    } else if (role === "superadmin") {
      setLoginMode("admin");
      setTenantSlug("plataforma");
      setEmail("superadmin@novamarket.pe");
      setPassword("admin2026");
      toast.info("Perfil autocompletado: Superadmin SaaS Global");
    } else {
      setLoginMode("admin");
      setTenantSlug("novamarket");
      setEmail("admin@novamarket.pe");
      setPassword("admin2026");
      toast.info("Perfil autocompletado: Administrador General de Tienda");
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(224,71%,4%)] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/60 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">NovaMarket POS</span>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 py-0">
                v2.4 Pro
              </Badge>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Enterprise Retail Suite</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" /> Servidor SUNAT & Supabase Online
          </span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand Highlights & Quick Demo Access */}
          <div className="lg:col-span-5 space-y-6 text-left hidden lg:block">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Punto de Venta de Alto Rendimiento
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Diseñado para supermercados y cadenas minoristas con facturación SUNAT en tiempo real y arquitectura multi-caja.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 shrink-0">
                  <Receipt className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Facturación Electrónica UBL 2.1</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Emisión instantánea de boletas, facturas y notas de crédito con QR y tickets de 80mm.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 shrink-0">
                  <Cpu className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Básculas & Lector de Códigos</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pesaje automático en caja y lectura rápida de códigos de barra EAN-13.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Seguridad & Arqueos Ciegos</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Autorizaciones con PIN de supervisor, retiros a bóveda y control inmutable de auditoría.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Demo Selector */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Sparkles className="size-3.5" /> Acceso Rápido de Demostración:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDemoProfile("cajero")}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 text-[11px] font-semibold text-slate-300 hover:text-white transition-all text-center"
                >
                  🛒 Cajero POS
                </button>
                <button
                  type="button"
                  onClick={() => setDemoProfile("supervisor")}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 text-[11px] font-semibold text-slate-300 hover:text-white transition-all text-center"
                >
                  🛡️ Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => setDemoProfile("admin")}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850 text-[11px] font-semibold text-slate-300 hover:text-white transition-all text-center"
                >
                  🏢 Admin Tienda
                </button>
                <button
                  type="button"
                  onClick={() => setDemoProfile("superadmin")}
                  className="px-2.5 py-2 rounded-xl bg-amber-950/40 border border-amber-800/60 hover:border-amber-500 hover:bg-amber-900/40 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-all text-center shadow-sm shadow-amber-950"
                >
                  👑 Superadmin SaaS
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Box */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/90 shadow-2xl shadow-black/60 relative">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => setLoginMode("cajero")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  loginMode === "cajero"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <KeyRound className="size-4" /> Terminal de Caja (PIN)
              </button>

              <button
                type="button"
                onClick={() => setLoginMode("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  loginMode === "admin"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Lock className="size-4" /> Administración & Finanzas
              </button>
            </div>

            {/* Mode 1: Cashier POS Login with PIN and Virtual Numpad */}
            {loginMode === "cajero" && (
              <form onSubmit={handleCashierLogin} className="space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Sucursal Asignada
                    </label>
                    <div className="relative">
                      <Building2 className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="surco">Sucursal Central - Surco</option>
                        <option value="san-isidro">Sucursal San Isidro - Begonias</option>
                        <option value="miraflores">Sucursal Miraflores - Larco</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Terminal / Caja Física
                    </label>
                    <div className="relative">
                      <Store className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <select
                        value={selectedRegister}
                        onChange={(e) => setSelectedRegister(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="caja-01">Caja 01 - Principal (Turno #124)</option>
                        <option value="caja-02">Caja 02 - Rápida (Turno #089)</option>
                        <option value="caja-03">Caja 03 - Autoservicio</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Cajero / Operador en Turno
                  </label>
                  <div className="relative">
                    <UserCheck className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <select
                      value={selectedCashier}
                      onChange={(e) => setSelectedCashier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="carlos">Carlos Alarcón (Cajero Titular - #4821)</option>
                      <option value="maria">María Gómez (Cajera - #9102)</option>
                      <option value="marcos">Marcos Ramos (Supervisor de Tienda - #7741)</option>
                    </select>
                  </div>
                </div>

                {/* PIN Display and Virtual Numpad */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="size-3.5 text-blue-400" /> Ingrese su PIN de 4-6 dígitos:
                    </span>
                    <button
                      type="button"
                      onClick={handleNumpadClear}
                      className="text-[11px] text-slate-500 hover:text-slate-300 font-semibold"
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* PIN dots display */}
                  <div className="flex justify-center items-center gap-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all ${
                          pin.length > idx
                            ? "bg-blue-500 shadow-md shadow-blue-500/50 scale-110"
                            : "border border-slate-700 bg-slate-950"
                        }`}
                      />
                    ))}
                  </div>

                  {/* On-screen Touch Numpad */}
                  <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto pt-1">
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleNumpadClick(num)}
                        className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-blue-600 active:text-white border border-slate-800 text-sm font-bold text-white font-mono transition-colors"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleNumpadClear}
                      className="h-11 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 transition-colors"
                    >
                      C
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadClick("0")}
                      className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-blue-600 active:text-white border border-slate-800 text-sm font-bold text-white font-mono transition-colors"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleNumpadDelete}
                      className="h-11 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Delete className="size-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || pin.length < 4}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  Abrir Terminal POS <ArrowRight className="size-4" />
                </button>
              </form>
            )}

            {/* Mode 2: Admin Credentials Login */}
            {loginMode === "admin" && (
              <form onSubmit={handleAdminLogin} className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Slug de la Empresa / Tenant
                  </label>
                  <div className="relative">
                    <Store className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      placeholder="novamarket"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Correo Electrónico Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@novamarket.pe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-400">
                      Contraseña
                    </label>
                    <a href="#" className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold">
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Recordar sesión en este equipo</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                >
                  Acceder al Panel Ejecutivo <ArrowRight className="size-4" />
                </button>
              </form>
            )}

            {/* Mobile demo helper */}
            <div className="lg:hidden mt-6 pt-4 border-t border-slate-800/80 text-center space-y-2">
              <span className="text-[11px] text-slate-400 block">Acceso Rápido Demo:</span>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setDemoProfile("cajero")}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300"
                >
                  Cajero
                </button>
                <button
                  onClick={() => setDemoProfile("supervisor")}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300"
                >
                  Supervisor
                </button>
                <button
                  onClick={() => setDemoProfile("admin")}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300"
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-800/60 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          © 2026 NovaMarket Supermercados S.A.C. — R.U.C. 20608912345
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <Link href="/" className="hover:text-slate-300 transition-colors">Inicio</Link>
          <span className="text-slate-700">•</span>
          <Link href="/pos" className="hover:text-slate-300 transition-colors">Terminal POS</Link>
          <span className="text-slate-700">•</span>
          <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
        </div>
      </footer>
    </div>
  );
}

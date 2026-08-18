"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ShoppingCart,
  LayoutDashboard,
  ArrowLeft,
  Lock,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { useUserSession } from "@/lib/auth/session-store";
import { canRoleAccessRoute } from "@/lib/auth/role-navigation";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, switchRole } = useUserSession();

  const isAllowed = canRoleAccessRoute(role, pathname);

  if (!isAllowed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 text-center select-none bg-[hsl(224,71%,4%)] animate-in fade-in duration-200">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-rose-800/40 shadow-2xl space-y-6">
          {/* Icon Badge */}
          <div className="size-20 rounded-3xl bg-rose-950/80 border-2 border-rose-700/60 flex items-center justify-center text-rose-400 mx-auto shadow-2xl shadow-rose-900/30">
            <ShieldAlert className="size-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-300 font-extrabold text-[11px] border border-rose-800 tracking-wider uppercase">
              Error 403 • Acceso Prohibido (RBAC)
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight pt-1">
              Módulo Restringido
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tu rol de <strong className="text-white font-bold">{user.roleTitle}</strong> no tiene permisos de seguridad para acceder a la ruta{" "}
              <code className="text-rose-300 font-mono bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
                {pathname}
              </code>
            </p>
          </div>

          {/* Role specific return CTA */}
          <div className="pt-2 space-y-2.5">
            {role === "cajero" ? (
              <Link
                href="/pos"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <ShoppingCart className="size-4" /> Volver a Terminal POS
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <LayoutDashboard className="size-4" /> Volver al Panel Ejecutivo
              </Link>
            )}

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              <span>¿Necesitas probar con privilegios administrativos?</span>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => switchRole("supervisor")}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                >
                  Cambiar a Supervisor
                </button>
                <button
                  type="button"
                  onClick={() => switchRole("admin")}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                >
                  Cambiar a Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

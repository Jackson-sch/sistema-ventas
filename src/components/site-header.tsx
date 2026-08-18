import Link from "next/link"
import { ShoppingCart, Store, Zap, ShieldCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur px-4 transition-[width,height] ease-linear lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-slate-400 hover:text-white hover:bg-slate-800" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-slate-800"
        />
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Store className="size-4 text-blue-400" />
          <span>Panel Ejecutivo</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 font-semibold border border-blue-800/60">
            Sucursal Central
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 text-xs font-semibold border border-emerald-800/50">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Cajas en Vivo (3 Activas)</span>
        </div>

        <Link
          href="/pos"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <ShoppingCart className="size-3.5" /> Abrir POS
        </Link>
      </div>
    </header>
  )
}

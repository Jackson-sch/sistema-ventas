"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  FileText,
  Store,
  Users,
  Settings,
  HelpCircle,
  ShieldCheck,
  Building2,
  Archive,
  BarChart3,
  Users2,
  Layers,
  Sparkles,
  UserCheck,
  Truck,
  Tag,
  FlaskConical,
  FileSpreadsheet,
  Crown,
  Activity,
  Server,
  ArrowLeftRight,
  ClipboardCheck,
} from "lucide-react"

import { NavMain, type NavGroup } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Navigation for Superadmin Global Platform Mode
const superadminNavigationGroups: NavGroup[] = [
  {
    label: "Plataforma SaaS Global",
    items: [
      {
        title: "Consola Superadmin",
        url: "/superadmin",
        icon: Crown,
        badge: "Global",
        badgeVariant: "default",
      },
      {
        title: "Empresas & Tenants",
        url: "/superadmin",
        icon: Building2,
        badge: "Multi-Store",
        badgeVariant: "default",
      },
      {
        title: "Auditoría de Seguridad",
        url: "/auditoria",
        icon: ShieldCheck,
        badge: "Logs",
        badgeVariant: "default",
      },
    ],
  },
  {
    label: "Infraestructura & Sistema",
    items: [
      {
        title: "Telemetría SUNAT & DB",
        url: "/superadmin",
        icon: Activity,
        badge: "99.98%",
        badgeVariant: "success",
      },
      {
        title: "Simulador de Venta (Dev)",
        url: "/dev/venta-test",
        icon: FlaskConical,
      },
    ],
  },
  {
    label: "Acceso a Tiendas & Sucursales",
    items: [
      {
        title: "Panel Ejecutivo Tienda",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Terminal POS",
        url: "/pos",
        icon: ShoppingCart,
      },
      {
        title: "Sucursales & Cajas",
        url: "/sucursales",
        icon: Store,
      },
      {
        title: "Usuarios & Permisos",
        url: "/usuarios",
        icon: Users2,
      },
    ],
  },
]

// Navigation for Standard Store / Tenant Mode
const storeNavigationGroups: NavGroup[] = [
  {
    label: "Punto de Venta",
    items: [
      {
        title: "Terminal POS",
        url: "/pos",
        icon: ShoppingCart,
        badge: "En Vivo",
        badgeVariant: "success",
      },
      {
        title: "Ventas & Cajas",
        url: "/ventas",
        icon: DollarSign,
        badge: "Turno #124",
        badgeVariant: "default",
      },
      {
        title: "Cotizaciones & Proformas",
        url: "/ventas/cotizaciones",
        icon: FileText,
        badge: "COT",
        badgeVariant: "default",
      },
      {
        title: "Resúmenes & Bajas (RC/RA)",
        url: "/ventas/resumenes",
        icon: FileSpreadsheet,
        badge: "SUNAT",
        badgeVariant: "default",
      },
      {
        title: "Clientes & Puntos",
        url: "/clientes",
        icon: Users,
      },
    ],
  },
  {
    label: "Inventario & Logística",
    items: [
      {
        title: "Stock & Catálogo",
        url: "/inventario",
        icon: Package,
      },
      {
        title: "Promociones & Combos",
        url: "/inventario/promociones",
        icon: Tag,
        badge: "2x1",
        badgeVariant: "default",
      },
      {
        title: "Compras & Proveedores",
        url: "/compras",
        icon: Truck,
      },
      {
        title: "Transferencias & GRE",
        url: "/inventario/transferencias",
        icon: Truck,
        badge: "T001",
        badgeVariant: "default",
      },
      {
        title: "Kardex Valorado",
        url: "/inventario/kardex",
        icon: Archive,
      },
      {
        title: "Toma de Inventario",
        url: "/inventario/conteo",
        icon: ClipboardCheck,
        badge: "Conteo",
        badgeVariant: "default",
      },
      {
        title: "Etiquetas & Góndolas",
        url: "/inventario/etiquetas",
        icon: Tag,
      },
    ],
  },
  {
    label: "Analítica & Control",
    items: [
      {
        title: "Dashboard Ejecutivo",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Reportes & Analítica",
        url: "/reportes",
        icon: BarChart3,
      },
      {
        title: "Libros SUNAT SIRE",
        url: "/reportes/sire",
        icon: FileSpreadsheet,
        badge: "14.1 / 8.1",
        badgeVariant: "default",
      },
      {
        title: "Auditoría de Acciones",
        url: "/auditoria",
        icon: ShieldCheck,
      },
      {
        title: "Prueba de Venta (Dev)",
        url: "/dev/venta-test",
        icon: FlaskConical,
      },
    ],
  },
  {
    label: "Administración SaaS",
    items: [
      {
        title: "Superadmin Global",
        url: "/superadmin",
        icon: Crown,
        badge: "SaaS",
        badgeVariant: "default",
      },
      {
        title: "Sucursales & Cajas",
        url: "/sucursales",
        icon: Store,
      },
      {
        title: "Usuarios & Roles",
        url: "/usuarios",
        icon: Users2,
      },
      {
        title: "Configuración Empresa",
        url: "/configuracion",
        icon: Settings,
      },
    ],
  },
]

const storeUser = {
  name: "Carlos Alarcón",
  email: "carlos.alarcon@novamarket.pe",
  avatar: "/avatars/carlos.jpg",
  role: "Cajero Principal",
  initials: "CA",
  isSuperadmin: false,
}

const superadminUser = {
  name: "Superadmin Global",
  email: "superadmin@novamarket.pe",
  avatar: "/avatars/admin.jpg",
  role: "Administrador Global de Plataforma",
  initials: "SG",
  isSuperadmin: true,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const isSuperadminMode = pathname?.startsWith("/superadmin")

  const currentGroups = isSuperadminMode ? superadminNavigationGroups : storeNavigationGroups
  const currentUser = isSuperadminMode ? superadminUser : storeUser

  return (
    <Sidebar collapsible="icon" className="bg-[hsl(224,71%,5%)] border-r border-slate-800/80" {...props}>
      {/* Brand Header & Tenant Context */}
      <SidebarHeader className="border-b border-slate-800/80 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-2 hover:bg-slate-800/60 text-white transition-colors"
            >
              {isSuperadminMode ? (
                <Link href="/superadmin" className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 shadow-md shadow-amber-500/30 shrink-0">
                    <Crown className="size-5 text-slate-950" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                    <span className="text-sm font-black text-white tracking-tight truncate">
                      NovaMarket Core
                    </span>
                    <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1 truncate">
                      👑 Superadmin SaaS
                    </span>
                  </div>
                </Link>
              ) : (
                <Link href="/dashboard" className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-500/30 shrink-0">
                    N
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                    <span className="text-sm font-bold text-white tracking-tight truncate">NovaMarket POS</span>
                    <span className="text-[11px] text-blue-400 font-medium flex items-center gap-1 truncate">
                      <Building2 className="size-3 shrink-0" /> Sucursal Central
                    </span>
                  </div>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Structured Navigation Groups */}
      <SidebarContent className="px-2">
        <NavMain groups={currentGroups} />
      </SidebarContent>

      {/* User / Superadmin Footer */}
      <SidebarFooter className="border-t border-slate-800/80 p-3">
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  FileText,
  Store,
  Users,
  Settings,
  ShieldCheck,
  Building2,
  Archive,
  BarChart3,
  Users2,
  Truck,
  Tag,
  FlaskConical,
  FileSpreadsheet,
  Crown,
  Activity,
  ClipboardCheck,
  CreditCard,
  Scale,
} from "lucide-react";
import { type NavGroup } from "@/components/nav-main";

export type UserRole = "cajero" | "supervisor" | "admin" | "superadmin";

export interface UserSessionProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  sucursal: string;
  avatar?: string;
  initials: string;
  isSuperadmin: boolean;
}

// 1. Navigation for CASHIER (Cajero) - Only operational POS tools
export const cashierNavigationGroups: NavGroup[] = [
  {
    label: "Operación de Caja",
    items: [
      {
        title: "Terminal POS",
        url: "/pos",
        icon: ShoppingCart,
        badge: "En Vivo",
        badgeVariant: "success",
      },
      {
        title: "Mis Ventas & Tickets",
        url: "/ventas",
        icon: DollarSign,
        badge: "Turno Activo",
        badgeVariant: "default",
      },
      {
        title: "Clientes & Puntos",
        url: "/clientes",
        icon: Users,
      },
    ],
  },
];

// 2. Navigation for SUPERVISOR (Floor / Shift Supervisor)
export const supervisorNavigationGroups: NavGroup[] = [
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
        title: "Resúmenes SUNAT (RC/RA)",
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
      {
        title: "Créditos & Cobranzas",
        url: "/clientes/creditos",
        icon: CreditCard,
        badge: "Fiado",
        badgeVariant: "default",
      },
    ],
  },
  {
    label: "Inventario de Tienda",
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
      {
        title: "Mermas & Desmedros",
        url: "/inventario/mermas",
        icon: Scale,
        badge: "SUNAT",
        badgeVariant: "default",
      },
    ],
  },
  {
    label: "Supervisión & Métricas",
    items: [
      {
        title: "Dashboard Ejecutivo",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Reportes de Ventas",
        url: "/reportes",
        icon: BarChart3,
      },
    ],
  },
];

// 3. Navigation for STORE ADMINISTRATOR (Gerente / Administrador de Tienda)
export const adminNavigationGroups: NavGroup[] = [
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
      {
        title: "Créditos & Cobranzas",
        url: "/clientes/creditos",
        icon: CreditCard,
        badge: "Fiado",
        badgeVariant: "default",
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
      {
        title: "Mermas & Desmedros",
        url: "/inventario/mermas",
        icon: Scale,
        badge: "SUNAT",
        badgeVariant: "default",
      },
    ],
  },
  {
    label: "Analítica & Fiscal",
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
    label: "Configuración Tienda",
    items: [
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
];

// 4. Navigation for SUPERADMIN GLOBAL (Dueño de Plataforma Multi-Tenant)
export const superadminNavigationGroups: NavGroup[] = [
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
];

export const DEMO_USERS: Record<UserRole, UserSessionProfile> = {
  cajero: {
    id: "user-cajero-1",
    name: "Carlos Alarcón",
    email: "carlos.alarcon@novamarket.pe",
    role: "cajero",
    roleTitle: "Cajero de Turno",
    sucursal: "Sucursal Central (Caja 01)",
    avatar: "/avatars/carlos.jpg",
    initials: "CA",
    isSuperadmin: false,
  },
  supervisor: {
    id: "user-supervisor-1",
    name: "María Gómez",
    email: "maria.gomez@novamarket.pe",
    role: "supervisor",
    roleTitle: "Supervisora de Turno",
    sucursal: "Sucursal Central (Surco)",
    avatar: "/avatars/maria.jpg",
    initials: "MG",
    isSuperadmin: false,
  },
  admin: {
    id: "user-admin-1",
    name: "Roberto Méndez",
    email: "admin@novamarket.pe",
    role: "admin",
    roleTitle: "Administrador de Tienda",
    sucursal: "NovaMarket Central",
    avatar: "/avatars/admin.jpg",
    initials: "RM",
    isSuperadmin: false,
  },
  superadmin: {
    id: "user-superadmin-1",
    name: "Superadmin Global",
    email: "superadmin@novamarket.pe",
    role: "superadmin",
    roleTitle: "Administrador Global de Plataforma",
    sucursal: "NovaMarket Core SaaS",
    avatar: "/avatars/superadmin.jpg",
    initials: "SG",
    isSuperadmin: true,
  },
};

export function getNavigationForRole(role: UserRole): NavGroup[] {
  switch (role) {
    case "cajero":
      return cashierNavigationGroups;
    case "supervisor":
      return supervisorNavigationGroups;
    case "admin":
      return adminNavigationGroups;
    case "superadmin":
      return superadminNavigationGroups;
    default:
      return cashierNavigationGroups;
  }
}

const ALLOWED_ROUTES_BY_ROLE: Record<UserRole, string[]> = {
  cajero: [
    "/pos",
    "/pos/display",
    "/ventas",
    "/clientes",
    "/consultas",
    "/login",
  ],
  supervisor: [
    "/pos",
    "/pos/display",
    "/ventas",
    "/ventas/cotizaciones",
    "/ventas/resumenes",
    "/clientes",
    "/clientes/creditos",
    "/inventario",
    "/inventario/promociones",
    "/inventario/conteo",
    "/inventario/etiquetas",
    "/inventario/mermas",
    "/dashboard",
    "/reportes",
    "/consultas",
    "/login",
  ],
  admin: [
    "/pos",
    "/pos/display",
    "/ventas",
    "/ventas/cotizaciones",
    "/ventas/resumenes",
    "/clientes",
    "/clientes/creditos",
    "/inventario",
    "/inventario/promociones",
    "/inventario/transferencias",
    "/inventario/kardex",
    "/inventario/conteo",
    "/inventario/etiquetas",
    "/inventario/mermas",
    "/compras",
    "/dashboard",
    "/reportes",
    "/reportes/sire",
    "/auditoria",
    "/dev/venta-test",
    "/sucursales",
    "/usuarios",
    "/configuracion",
    "/consultas",
    "/login",
  ],
  superadmin: ["*"],
};

export function canRoleAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === "superadmin") return true;
  if (!pathname || pathname === "/") return true;

  const cleanPath = pathname.split("?")[0].replace(/\/$/, "") || "/";

  // For cashier, strictly forbid admin/supervisor sub-routes
  if (role === "cajero") {
    if (
      cleanPath.startsWith("/ventas/resumenes") ||
      cleanPath.startsWith("/ventas/cotizaciones") ||
      cleanPath.startsWith("/inventario") ||
      cleanPath.startsWith("/compras") ||
      cleanPath.startsWith("/reportes") ||
      cleanPath.startsWith("/dashboard") ||
      cleanPath.startsWith("/usuarios") ||
      cleanPath.startsWith("/sucursales") ||
      cleanPath.startsWith("/configuracion") ||
      cleanPath.startsWith("/auditoria") ||
      cleanPath.startsWith("/superadmin")
    ) {
      return false;
    }
    return (
      cleanPath === "/pos" ||
      cleanPath.startsWith("/pos/") ||
      cleanPath === "/ventas" ||
      cleanPath === "/clientes" ||
      cleanPath === "/consultas"
    );
  }

  if (role === "supervisor") {
    if (
      cleanPath.startsWith("/compras") ||
      cleanPath.startsWith("/inventario/transferencias") ||
      cleanPath.startsWith("/inventario/kardex") ||
      cleanPath.startsWith("/reportes/sire") ||
      cleanPath.startsWith("/usuarios") ||
      cleanPath.startsWith("/sucursales") ||
      cleanPath.startsWith("/configuracion") ||
      cleanPath.startsWith("/auditoria") ||
      cleanPath.startsWith("/superadmin")
    ) {
      return false;
    }
  }

  if (role === "admin") {
    if (cleanPath.startsWith("/superadmin")) {
      return false;
    }
  }

  return true;
}

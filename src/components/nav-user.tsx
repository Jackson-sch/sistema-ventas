"use client";

import Link from "next/link";
import {
  Bell,
  CreditCard,
  LogOut,
  MoreVertical,
  User,
  ShieldCheck,
  RotateCcw,
  Crown,
  Settings,
  Activity,
  ArrowRightLeft,
  Check,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserRole, UserSessionProfile } from "@/lib/auth/role-navigation";

interface NavUserProps {
  user: UserSessionProfile;
  onSwitchRole?: (role: UserRole) => void;
}

export function NavUser({ user, onSwitchRole }: NavUserProps) {
  const { isMobile } = useSidebar();
  const isSuperadmin = user.isSuperadmin || user.role === "superadmin";

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case "superadmin":
        return "text-amber-400";
      case "admin":
        return "text-purple-400";
      case "supervisor":
        return "text-emerald-400";
      case "cajero":
      default:
        return "text-blue-400";
    }
  };

  const getAvatarBg = () => {
    switch (user.role) {
      case "superadmin":
        return "bg-amber-500 text-slate-950 font-black";
      case "admin":
        return "bg-purple-600 text-white font-bold";
      case "supervisor":
        return "bg-emerald-600 text-white font-bold";
      case "cajero":
      default:
        return "bg-blue-600 text-white font-bold";
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-slate-800 data-[state=open]:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Avatar className={`h-8 w-8 rounded-xl border text-xs flex items-center justify-center ${
                isSuperadmin ? "border-amber-400/40" : "border-slate-700/50"
              }`}>
                <AvatarFallback className={getAvatarBg()}>
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-bold text-white flex items-center gap-1.5">
                  {user.name}
                  {isSuperadmin && <Crown className="size-3 text-amber-400 shrink-0" />}
                </span>
                <span className={`truncate text-[11px] font-semibold ${getRoleBadgeColor()}`}>
                  {user.roleTitle}
                </span>
              </div>
              <MoreVertical className="ml-auto size-4 text-slate-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 shadow-2xl p-1.5"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-2.5 py-2 text-left text-xs">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${getAvatarBg()}`}>
                  {user.initials}
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-bold text-white">
                    {user.name}
                  </span>
                  <span className="truncate text-[10px] text-slate-400 font-mono">
                    {user.email}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold truncate">
                    {user.sucursal}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />

            {/* Role Switcher for Fast Testing */}
            {onSwitchRole && (
              <>
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Simular Rol de Usuario:
                </div>
                <DropdownMenuGroup className="text-xs space-y-0.5">
                  <DropdownMenuItem
                    onClick={() => onSwitchRole("cajero")}
                    className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-400"></span>
                      <span>Cajero (Solo POS & Clientes)</span>
                    </span>
                    {user.role === "cajero" && <Check className="size-3.5 text-blue-400" />}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onSwitchRole("supervisor")}
                    className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-400"></span>
                      <span>Supervisor (POS + Inventario)</span>
                    </span>
                    {user.role === "supervisor" && <Check className="size-3.5 text-emerald-400" />}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onSwitchRole("admin")}
                    className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-purple-400"></span>
                      <span>Administrador de Tienda</span>
                    </span>
                    {user.role === "admin" && <Check className="size-3.5 text-purple-400" />}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => onSwitchRole("superadmin")}
                    className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Crown className="size-3.5 text-amber-400" />
                      <span>Superadmin Global SaaS</span>
                    </span>
                    {user.role === "superadmin" && <Check className="size-3.5 text-amber-400" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-slate-800" />
              </>
            )}

            <DropdownMenuItem asChild className="focus:bg-rose-950/60 focus:text-rose-400 text-rose-400 cursor-pointer rounded-xl">
              <Link href="/login" className="flex items-center gap-2 w-full">
                <LogOut className="size-4" />
                <span>Cerrar Sesión</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

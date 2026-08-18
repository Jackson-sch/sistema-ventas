"use client"

import Link from "next/link"
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
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export interface UserProfile {
  name: string
  email: string
  avatar?: string
  role?: string
  initials?: string
  isSuperadmin?: boolean
}

export function NavUser({
  user,
}: {
  user: UserProfile
}) {
  const { isMobile } = useSidebar()
  const isSuperadmin = !!user.isSuperadmin
  const roleText = user.role || (isSuperadmin ? "Administrador Global" : "Cajero / Supervisor")
  const initials = user.initials || (isSuperadmin ? "SG" : "CA")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-slate-800 data-[state=open]:text-white hover:bg-slate-800/60 transition-colors"
            >
              <Avatar className={`h-8 w-8 rounded-xl border text-xs font-black flex items-center justify-center ${
                isSuperadmin
                  ? "bg-amber-500 text-slate-950 border-amber-400/40"
                  : "bg-blue-600 text-white border-blue-500/30"
              }`}>
                <AvatarFallback className={isSuperadmin ? "bg-amber-500 text-slate-950 font-black" : "bg-blue-600 text-white font-bold"}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-bold text-white flex items-center gap-1.5">
                  {user.name}
                  {isSuperadmin && <Crown className="size-3 text-amber-400 shrink-0" />}
                </span>
                <span className={`truncate text-[11px] font-semibold ${
                  isSuperadmin ? "text-amber-400" : "text-blue-400"
                }`}>
                  {roleText}
                </span>
              </div>
              <MoreVertical className="ml-auto size-4 text-slate-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-60 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 shadow-2xl p-1.5"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-2.5 py-2 text-left text-xs">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                  isSuperadmin ? "bg-amber-500 text-slate-950 font-black" : "bg-blue-600 text-white"
                }`}>
                  {initials}
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-bold text-white flex items-center gap-1">
                    {user.name}
                  </span>
                  <span className="truncate text-[10px] text-slate-400 font-mono">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />

            {isSuperadmin ? (
              /* Superadmin Context Options */
              <DropdownMenuGroup className="text-xs">
                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl">
                  <Link href="/superadmin" className="flex items-center gap-2 w-full">
                    <Crown className="size-4 text-amber-400" />
                    <span>Consola Superadmin</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl">
                  <Link href="/auditoria" className="flex items-center gap-2 w-full">
                    <ShieldCheck className="size-4 text-cyan-400" />
                    <span>Auditoría Global de Seguridad</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            ) : (
              /* Regular Store User Options */
              <DropdownMenuGroup className="text-xs">
                <DropdownMenuItem className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl">
                  <User className="size-4 text-slate-400" />
                  <span>Perfil de Usuario</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl">
                  <Link href="/ventas" className="flex items-center gap-2 w-full">
                    <RotateCcw className="size-4 text-amber-400" />
                    <span>Cierre de Turno / Arqueo</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer rounded-xl">
                  <Link href="/usuarios" className="flex items-center gap-2 w-full">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    <span>Permisos de Supervisor</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}

            <DropdownMenuSeparator className="bg-slate-800" />
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
  )
}

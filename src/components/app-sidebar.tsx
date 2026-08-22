"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  Building2,
  Store,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUserSession } from "@/lib/auth/session-store";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { role, user, navigationGroups, switchRole } = useUserSession();

  const isSuperadminMode = role === "superadmin" || pathname?.startsWith("/superadmin");

  return (
    <Sidebar collapsible="icon" className="bg-[hsl(224,71%,5%)] border-r border-slate-800/80" {...props}>
      {/* Brand Header & Context */}
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
                      <Crown className="size-3 text-amber-400" /> Superadmin SaaS
                    </span>
                  </div>
                </Link>
              ) : (
                <Link href={role === "cajero" ? "/pos" : "/dashboard"} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-500/30 shrink-0">
                    N
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                    <span className="text-sm font-bold text-white tracking-tight truncate">NovaMarket POS</span>
                    <span
                      suppressHydrationWarning
                      className="text-[11px] text-blue-400 font-medium flex items-center gap-1 truncate"
                    >
                      <Building2 className="size-3 shrink-0" /> {user.sucursal || "Sucursal Central"}
                    </span>
                  </div>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Role-filtered Navigation Groups */}
      <SidebarContent className="px-2">
        <NavMain groups={navigationGroups} />
      </SidebarContent>

      {/* Dynamic User Profile & Role Switcher */}
      <SidebarFooter className="border-t border-slate-800/80 p-3">
        <NavUser user={user} onSwitchRole={switchRole} />
      </SidebarFooter>
    </Sidebar>
  );
}

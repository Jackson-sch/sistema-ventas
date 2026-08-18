"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

export interface NavGroup {
  label?: string
  items: {
    title: string
    url: string
    icon: LucideIcon
    badge?: string
    badgeVariant?: "default" | "success" | "warning" | "amber"
  }[]
}

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const rawPathname = usePathname() || "/"
  // Normalize pathname to prevent trailing slash mismatches
  const currentPath = rawPathname.split("?")[0].replace(/\/+$/, "") || "/"

  return (
    <div className="flex flex-col gap-4 py-2">
      {groups.map((group, idx) => (
        <SidebarGroup key={idx} className="p-0">
          {group.label && (
            <SidebarGroupLabel className="text-[10px] font-bold tracking-wider uppercase text-slate-500 px-3 pb-1">
              {group.label}
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="gap-1">
            {group.items.map((item) => {
              const targetPath = item.url.split("?")[0].replace(/\/+$/, "") || "/"
              // Strict exact match to avoid parent/child double highlights
              const isActive = currentPath === targetPath

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={`h-9 px-3 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "!bg-blue-600 !text-white shadow-md shadow-blue-600/30 font-bold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3 w-full">
                      <item.icon className={`size-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate flex-1">{item.title}</span>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold shrink-0 ${
                          item.badgeVariant === "success"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : item.badgeVariant === "warning"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </div>
  )
}

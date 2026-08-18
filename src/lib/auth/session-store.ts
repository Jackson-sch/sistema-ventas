"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  UserRole,
  UserSessionProfile,
  DEMO_USERS,
  getNavigationForRole,
} from "./role-navigation";

const SESSION_STORAGE_KEY = "novamarket_active_role";

export function useUserSession() {
  const pathname = usePathname();
  const router = useRouter();

  // If path starts with /superadmin, default to superadmin
  const isSuperadminPath = pathname?.startsWith("/superadmin");

  // SSR deterministic initial state to eliminate hydration mismatches
  const [role, setRole] = useState<UserRole>(isSuperadminPath ? "superadmin" : "admin");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY) as UserRole;
      if (saved && ["cajero", "supervisor", "admin", "superadmin"].includes(saved)) {
        setRole(isSuperadminPath ? "superadmin" : saved);
      }
    }
  }, [isSuperadminPath]);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, newRole);
    }
    if (newRole === "superadmin") {
      router.push("/superadmin");
    } else if (newRole === "cajero") {
      router.push("/pos");
    } else {
      router.push("/dashboard");
    }
  };

  const activeUser: UserSessionProfile = DEMO_USERS[role] || DEMO_USERS.cajero;
  const navigationGroups = getNavigationForRole(role);

  return {
    role,
    user: activeUser,
    navigationGroups,
    switchRole,
    isMounted,
  };
}

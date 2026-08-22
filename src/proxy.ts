import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { canRoleAccessRoute, UserRole } from "@/lib/auth/role-navigation";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, internal next files, api routes or public media
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$/)
  ) {
    return await updateSession(request);
  }

  // Get active user role from cookie
  const activeRole =
    (request.cookies.get("novamarket_active_role")?.value as UserRole) ||
    (pathname.startsWith("/superadmin") ? "superadmin" : "admin");

  // Check RBAC permission for the requested route
  const isAllowed = canRoleAccessRoute(activeRole, pathname);

  if (!isAllowed) {
    // If superadmin tries to access tenant store pages, redirect strictly to superadmin console
    if (activeRole === "superadmin") {
      const url = request.nextUrl.clone();
      url.pathname = "/superadmin";
      return NextResponse.redirect(url);
    }

    // If cashier tries to access admin pages, redirect to pos
    if (activeRole === "cajero") {
      const url = request.nextUrl.clone();
      url.pathname = "/pos";
      return NextResponse.redirect(url);
    }

    // If regular admin/supervisor tries to access superadmin console, redirect to dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

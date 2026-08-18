import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[hsl(224,71%,4%)] min-h-screen">
        <SiteHeader />
        <div className="flex-1 flex flex-col overflow-x-hidden">
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center p-8 text-xs font-mono text-slate-500">
                Cargando módulo...
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

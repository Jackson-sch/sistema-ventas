import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SectionCards } from "@/components/section-cards"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { TopProductsCard } from "@/components/top-products-card"
import { RegistersStatusCard } from "@/components/registers-status-card"
import { RecentTransactionsTable } from "@/components/recent-transactions-table"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getDashboardData } from "@/actions/data-fetchers"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[hsl(224,71%,4%)] min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex flex-col gap-6 p-4 lg:p-6 overflow-x-hidden">
          {/* Executive KPI Cards */}
          <SectionCards data={data.summary} />

          {/* Realtime Chart & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-0">
            <div className="lg:col-span-2">
              <ChartAreaInteractive data={data.chartData} />
            </div>
            <div className="lg:col-span-1">
              <TopProductsCard data={data.topProducts} />
            </div>
          </div>

          {/* Cash Registers Status Monitor */}
          <RegistersStatusCard data={data.registersStatus} />

          {/* Live Transactions & SUNAT Invoices */}
          <RecentTransactionsTable data={data.recentTransactions} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
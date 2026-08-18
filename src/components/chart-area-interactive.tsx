"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface ChartDatum {
  date: string;
  ventas: number;
  tickets: number;
}

const FALLBACK_CHART_DATA: ChartDatum[] = [
  { date: "2026-08-01", ventas: 12200, tickets: 450 },
  { date: "2026-08-02", ventas: 14700, tickets: 580 },
  { date: "2026-08-03", ventas: 16200, tickets: 620 },
  { date: "2026-08-04", ventas: 18400, tickets: 760 },
  { date: "2026-08-05", ventas: 21300, tickets: 890 },
  { date: "2026-08-06", ventas: 25100, tickets: 1140 },
  { date: "2026-08-07", ventas: 27500, tickets: 1280 },
  { date: "2026-08-08", ventas: 24900, tickets: 1120 },
  { date: "2026-08-09", ventas: 19500, tickets: 810 },
  { date: "2026-08-10", ventas: 22100, tickets: 940 },
  { date: "2026-08-11", ventas: 23700, tickets: 990 },
  { date: "2026-08-12", ventas: 26200, tickets: 1180 },
  { date: "2026-08-13", ventas: 27800, tickets: 1250 },
  { date: "2026-08-14", ventas: 28100, tickets: 1390 },
  { date: "2026-08-15", ventas: 28450, tickets: 1482 },
]

const chartConfig = {
  ventas: {
    label: "Ventas (S/)",
    color: "hsl(217 91% 60%)",
  },
  tickets: {
    label: "Tickets Emitidos",
    color: "hsl(158 75% 45%)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data }: { data?: ChartDatum[] }) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("15d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = data && data.length > 0 ? data : FALLBACK_CHART_DATA
  const referenceDate = new Date(chartData[chartData.length - 1].date)

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    let daysToSubtract = 15
    if (timeRange === "7d") {
      daysToSubtract = 7
    } else if (timeRange === "3d") {
      daysToSubtract = 3
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="border border-slate-800 bg-slate-900/90 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
            Flujo de Ventas & Transacciones en Vivo
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Evolución del volumen diario facturado (S/) y tickets procesados por caja
          </CardDescription>
        </div>
        <div className="shrink-0">
          <div className="hidden sm:block">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(v) => v && setTimeRange(v)}
              variant="outline"
              className="flex bg-slate-950/80 border border-slate-800 rounded-xl p-0.5"
            >
              <ToggleGroupItem value="15d" className="h-7 px-2.5 text-xs font-semibold text-slate-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white rounded-lg">
                15 días
              </ToggleGroupItem>
              <ToggleGroupItem value="7d" className="h-7 px-2.5 text-xs font-semibold text-slate-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white rounded-lg">
                7 días
              </ToggleGroupItem>
              <ToggleGroupItem value="3d" className="h-7 px-2.5 text-xs font-semibold text-slate-300 data-[state=on]:bg-blue-600 data-[state=on]:text-white rounded-lg">
                3 días
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="sm:hidden block">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-32 h-8 text-xs font-semibold bg-slate-950 border-slate-800 text-slate-200"
                aria-label="Seleccionar rango"
              >
                <SelectValue placeholder="15 días" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-slate-900 border-slate-800 text-slate-200">
                <SelectItem value="15d" className="text-xs">
                  15 días
                </SelectItem>
                <SelectItem value="7d" className="text-xs">
                  7 días
                </SelectItem>
                <SelectItem value="3d" className="text-xs">
                  3 días
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] sm:h-[300px] w-full"
        >
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillVentas" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(217 91% 60%)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(217 91% 60%)"
                  stopOpacity={0.0}
                />
              </linearGradient>
              <linearGradient id="fillTickets" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(158 75% 45%)"
                  stopOpacity={0.5}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(158 75% 45%)"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("es-PE", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(val) => `S/ ${(val / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={{ stroke: "#334155", strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  className="bg-slate-900 border-slate-800 text-white"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-PE", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="ventas"
              type="monotone"
              fill="url(#fillVentas)"
              stroke="hsl(217 91% 60%)"
              strokeWidth={2.5}
            />
            <Area
              dataKey="tickets"
              type="monotone"
              fill="url(#fillTickets)"
              stroke="hsl(158 75% 45%)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

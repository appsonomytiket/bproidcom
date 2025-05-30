
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { AdminSaleData } from "@/lib/types"
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

interface AdminSalesChartProps {
  data: AdminSaleData[];
}

export function AdminSalesChart({ data }: AdminSalesChartProps) {
  // Simple month name translation
  const translateMonth = (month: string) => {
    const monthMap: { [key: string]: string } = {
      'Jan': 'Jan', 'Feb': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr', 
      'May': 'Mei', 'Jun': 'Jun', 'Jul': 'Jul', 'Aug': 'Agu', 
      'Sep': 'Sep', 'Oct': 'Okt', 'Nov': 'Nov', 'Dec': 'Des'
    };
    return monthMap[month] || month;
  };

  const translatedData = data.map(item => ({...item, month: translateMonth(item.month)}));

  const chartConfig = {
    sales: {
      label: "Penjualan (Rb IDR)",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Analitik Penjualan</CardTitle>
        <CardDescription>Kinerja penjualan bulanan (dalam ribuan IDR)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart accessibilityLayer data={translatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value}K`} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--accent) / 0.2)" }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

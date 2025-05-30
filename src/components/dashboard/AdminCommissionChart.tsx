
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { AdminCommissionData } from "@/lib/types";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface AdminCommissionChartProps {
  data: AdminCommissionData[];
}

export function AdminCommissionChart({ data }: AdminCommissionChartProps) {
  // Simple month name translation if needed, or ensure data is pre-translated
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
    commissions: {
      label: "Komisi (Rb IDR)",
      color: "hsl(var(--accent))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Pembayaran Komisi</CardTitle>
        <CardDescription>Pembayaran komisi bulanan (dalam ribuan IDR)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart accessibilityLayer data={translatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value}K`} />
                <Tooltip
                  content={<ChartTooltipContent indicator="dot" />}
                  cursor={{ stroke: "hsl(var(--accent))", strokeWidth: 2, strokeDasharray: "3 3" }}
                />
                <Line
                  type="monotone"
                  dataKey="commissions"
                  stroke="var(--color-commissions)"
                  strokeWidth={2}
                  activeDot={{ r: 8, style: { fill: "var(--color-commissions)" } }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}


"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { AdminSaleData } from "@/lib/types"
import { ChartTooltipContent } from "@/components/ui/chart"

interface AdminSalesChartProps {
  data: AdminSaleData[];
}

export function AdminSalesChart({ data }: AdminSalesChartProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Sales Analytics</CardTitle>
        <CardDescription>Monthly sales performance (in thousands IDR)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value}K`} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--accent) / 0.2)" }} />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

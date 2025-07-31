"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"

interface PerformanceChartProps {
  data: {
    date: string
    value: number
  }[]
  title: string
  valuePrefix?: string
  valueSuffix?: string
}

export function PerformanceChart({ data, title, valuePrefix = "", valueSuffix = "" }: PerformanceChartProps) {
  const { theme } = useTheme()

  const CustomTooltip = ({
    active,
    payload,
    label
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2d3748] border border-[#4a5568] rounded-md shadow-md p-3">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-sm text-cyan-accent">
            {valuePrefix}
            {payload[0].value.toLocaleString()}
            {valueSuffix}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="dashboard-card">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-[250px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
              <XAxis
                dataKey="date"
                stroke="#a0aec0"
                fontSize={12}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#a0aec0" }}
                tickMargin={5}
              />
              <YAxis
                stroke="#a0aec0"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${valuePrefix}${value}${valueSuffix}`}
                tick={{ fontSize: 10, fill: "#a0aec0" }}
                width={40}
              />
              <Tooltip content={<CustomTooltip active={undefined} payload={undefined} label={undefined} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00ffff"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#00ffff", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

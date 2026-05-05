"use client"

import { useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { parseISO, getYear, getMonth } from "date-fns"
import type { JobWithCalculations } from "@/types"

type DashboardJob = Pick<JobWithCalculations, "month_sold" | "sales_price">

interface RevenueChartProps {
  jobs: DashboardJob[]
  years: number[]
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const YEAR_COLORS: Record<number, string> = {
  2025: "#6366f1",
  2026: "#f59e0b",
}

function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export default function RevenueChart({ jobs, years }: RevenueChartProps) {
  const chartData = useMemo(() => {
    // Step 1 — bucket revenue by year and month
    const monthly: Record<number, Record<number, number>> = {}
    for (const year of years) {
      monthly[year] = {}
      for (let m = 0; m < 12; m++) monthly[year][m] = 0
    }

    for (const job of jobs) {
      if (!job.month_sold) continue
      const date = parseISO(job.month_sold)
      const year = getYear(date)
      const month = getMonth(date)
      if (monthly[year]?.[month] !== undefined) {
        monthly[year][month] += job.sales_price ?? 0
      }
    }

    // Step 2 — convert to cumulative running totals per year
    const cumulative: Record<number, Record<number, number>> = {}
    for (const year of years) {
      cumulative[year] = {}
      let running = 0
      for (let m = 0; m < 12; m++) {
        running += monthly[year][m]
        cumulative[year][m] = Math.round(running)
      }
    }

    // Step 3 — build chart rows, one per month
    return MONTHS.map((label, monthIndex) => {
      const row: Record<string, string | number> = { month: label }
      for (const year of years) {
        row[String(year)] = cumulative[year]?.[monthIndex] ?? 0
      }
      return row
    })
  }, [jobs, years])

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Cumulative Revenue</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Sold jobs only · all years · year-to-date running total
        </p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrencyShort}
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value) => {
              if (value === undefined || value === null) return "—"
              return new Intl.NumberFormat("en-CA", {
                style: "currency",
                currency: "CAD",
                maximumFractionDigits: 0,
              }).format(value as number)
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "16px" }} />
          {years.map(year => (
            <Line
              key={year}
              type="monotone"
              dataKey={String(year)}
              stroke={YEAR_COLORS[year] ?? "#6b7280"}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
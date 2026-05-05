import { useMemo } from "react"
import type { JobWithCalculations } from "@/types"

type DashboardJob = Pick<JobWithCalculations, "sales_price" | "mgn" | "squares">


interface SummaryCardsProps {
  jobs: DashboardJob[]           // year + salesperson filtered — for card metrics
  allJobs: DashboardJob[]        // salesperson filtered only — for total job count
  selectedYear: number | "all"
}

interface CardProps {
  title: string
  value: string
  subtitle?: string
}

function Card({ title, value, subtitle }: CardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export default function SummaryCards({ jobs, allJobs, selectedYear }: SummaryCardsProps) {
  const metrics = useMemo(() => {
    const totalJobs = allJobs.length
    const soldJobs = jobs.length

    const totalRevenue = jobs.reduce((sum, j) => sum + (j.sales_price ?? 0), 0)
    const totalMargin = jobs.reduce((sum, j) => sum + (j.mgn ?? 0), 0)

    const avgMarginPct = totalRevenue > 0
      ? (totalMargin / totalRevenue) * 100
      : 0

    const jobsWithSquares = jobs.filter(j => (j.squares ?? 0) > 0)
    const avgPerSquare = jobsWithSquares.length > 0
      ? jobsWithSquares.reduce((sum, j) => sum + ((j.sales_price ?? 0) / j.squares!), 0) / jobsWithSquares.length
      : 0

    return { totalJobs, soldJobs, totalRevenue, totalMargin, avgMarginPct, avgPerSquare }
  }, [jobs, allJobs])

  const yearLabel = selectedYear === "all" ? "all years" : String(selectedYear)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <Card
        title="Total Jobs"
        value={String(metrics.totalJobs)}
        subtitle={`${metrics.soldJobs} sold`}
      />
      <Card
        title="Total Revenue"
        value={formatCurrency(metrics.totalRevenue)}
        subtitle={`Sold jobs, ${yearLabel}`}
      />
      <Card
        title="Total Margin"
        value={formatCurrency(metrics.totalMargin)}
        subtitle={`Sold jobs, ${yearLabel}`}
      />
      <Card
        title="Avg Margin %"
        value={formatPercent(metrics.avgMarginPct)}
        subtitle={`Sold jobs, ${yearLabel}`}
      />
      <Card
        title="Avg $/Square"
        value={formatCurrency(metrics.avgPerSquare)}
        subtitle="Excl. 0-square jobs"
      />
    </div>
  )
}
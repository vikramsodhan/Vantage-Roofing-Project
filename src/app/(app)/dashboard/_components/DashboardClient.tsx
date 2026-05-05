"use client"

import { useState, useMemo } from "react"
import { parseISO, getYear } from "date-fns"
import SummaryCards from "./SummaryCards"
import RevenueChart from "./RevenueChart"
import type { JobWithCalculations, Profile } from "@/types"

type DashboardJob = Pick<JobWithCalculations,
  "id" | "sold" | "month_sold" | "sales_price" | "mgn" | "squares" | "salesperson_id" | "salesperson_name"
>

type DashboardSalesperson = Pick<Profile, "id" | "full_name">

interface DashboardClientProps {
  jobs: DashboardJob[]
  salespersons: DashboardSalesperson[]
}

const YEARS = [2025, 2026]
const CURRENT_YEAR = 2026

export default function DashboardClient({ jobs, salespersons }: DashboardClientProps) {
  const [selectedYear, setSelectedYear] = useState<number | "all">(CURRENT_YEAR)
  const [selectedSalesperson, setSelectedSalesperson] = useState<string | "all">("all")

  // Filter jobs by salesperson first — applies to both cards and chart
  const salespersonFiltered = useMemo(() => {
    if (selectedSalesperson === "all") return jobs
    return jobs.filter(j => j.salesperson_id === selectedSalesperson)
  }, [jobs, selectedSalesperson])

  // Filter by year for the summary cards only
  const cardJobs = useMemo(() => {
    if (selectedYear === "all") return salespersonFiltered
    return salespersonFiltered.filter(j => {
      if (!j.month_sold) {
        return false
      }
      return getYear(parseISO(j.month_sold)) === selectedYear
    })
  }, [salespersonFiltered, selectedYear])

  return (
    <div className="space-y-8">

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Year
          </label>
          <div className="flex gap-2">
            {YEARS.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedYear === year
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {year}
              </button>
            ))}
            <button
              onClick={() => setSelectedYear("all")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedYear === "all"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Years
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Salesperson
          </label>
          <select
            value={selectedSalesperson}
            onChange={e => setSelectedSalesperson(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Salespersons</option>
            {salespersons.map(s => (
              <option key={s.id} value={s.id}>
                {s.full_name ?? "Unknown"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards jobs={cardJobs} allJobs={salespersonFiltered} selectedYear={selectedYear} />

      {/* Chart — always shows all years, filtered by salesperson only */}
      <RevenueChart jobs={salespersonFiltered} years={YEARS} />

    </div>
  )
}
"use client"

/**
 * src/app/(app)/jobs/_components/JobForm.tsx — Job Form
 *
 * CLIENT COMPONENT — handles all user interaction:
 * - Controlled inputs via useState
 * - Month/year pickers for month_quoted and month_sold
 * - Calls the createJob server action on submit
 * - Redirects to /jobs on success
 *
 * Kept intentionally barebones — plain inputs, no fancy UI yet.
 * Validation errors are browser alerts for now.
 *
 * Props:
 * - mode: "create" | "edit" — edit will pre-fill defaultValues (not wired yet)
 * - divisions, workTypes, salespersons — fetched server-side and passed in
 * - defaultValues — optional, used by edit page to pre-fill (wired up later)
 *
 * Why useTransition instead of a loading boolean?
 * useTransition is built for marking server interactions as "pending".
 * isPending stays true for the full round-trip to the server action —
 * from the moment the user clicks Submit until createJob() returns.
 * A manual loading state would require setLoading(true) before and
 * setLoading(false) after, with a try/finally to handle errors.
 * useTransition handles all of that automatically.
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createJob } from "../actions"
import type { Division, WorkType, Profile, Job } from "@/types"

// Month options for the month picker
const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

// Year options — current year + 1 down to 2015
function getYears(): number[] {
  const current = new Date().getFullYear()
  return Array.from({ length: current - 2014 + 1 }, (_, i) => current + 1 - i)
}

/**
 * Convert separate month + year numbers into the YYYY-MM-01 string
 * the database expects. Returns null if either value is missing.
 *
 * e.g. month=3, year=2024 → "2024-03-01"
 */
function toMonthDate(month: number | null, year: number | null): string | null {
  if (!month || !year) return null
  return `${year}-${String(month).padStart(2, "0")}-01`
}

interface JobFormProps {
  mode: "create" | "edit"
  divisions: Pick<Division, "id" | "name">[]
  workTypes: Pick<WorkType, "id" | "name">[]
  salespersons: Pick<Profile, "id" | "full_name">[]
  // defaultValues wired up later when we build the edit page
  defaultValues?: Partial<Job>
}

export default function JobForm({
  mode,
  divisions,
  workTypes,
  salespersons,
  defaultValues,
}: JobFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Field state ──────────────────────────────────────────────────────────
  // Each field maps directly to a database column.
  // We use separate month/year state for MQ and MS because the database
  // stores a date (YYYY-MM-01) but the UI shows two separate dropdowns.

  const [jobAddress, setJobAddress] = useState(defaultValues?.job_address ?? "")
  const [division, setDivision] = useState(defaultValues?.division ?? "")
  const [typeOfWork, setTypeOfWork] = useState(defaultValues?.type_of_work ?? "")
  const [salespersonId, setSalespersonId] = useState(defaultValues?.salesperson_id ?? "")
  const [sold, setSold] = useState<boolean>(defaultValues?.sold ?? false)

  // Month Quoted — stored as YYYY-MM-01, displayed as two dropdowns
  const [mqMonth, setMqMonth] = useState<number | null>(null)
  const [mqYear, setMqYear] = useState<number | null>(null)

  // Month Sold — same pattern
  const [msMonth, setMsMonth] = useState<number | null>(null)
  const [msYear, setMsYear] = useState<number | null>(null)

  const [squares, setSquares] = useState<string>(defaultValues?.squares?.toString() ?? "")
  const [days, setDays] = useState<string>(defaultValues?.days?.toString() ?? "")
  const [materials, setMaterials] = useState<string>(defaultValues?.materials?.toString() ?? "")
  const [labour, setLabour] = useState<string>(defaultValues?.labour?.toString() ?? "")
  const [disposal, setDisposal] = useState<string>(defaultValues?.disposal?.toString() ?? "")
  const [warranty, setWarranty] = useState<string>(defaultValues?.warranty?.toString() ?? "")
  const [other, setOther] = useState<string>(defaultValues?.other?.toString() ?? "")
  const [gutters, setGutters] = useState<string>(defaultValues?.gutters?.toString() ?? "")
  const [salesPrice, setSalesPrice] = useState<string>(defaultValues?.sales_price?.toString() ?? "")

  // ── Validation ──────────────────────────────────────────────────────────
  // Basic client-side check before hitting the server.
  // Returns an error message string or null if valid.
  function validate(): string | null {
    if (!jobAddress.trim()) return "Job address is required."
    return null
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      alert(validationError)
      return
    }

    startTransition(async () => {
      const result = await createJob({
        job_address: jobAddress.trim(),
        division: division || null,
        type_of_work: typeOfWork || null,
        salesperson_id: salespersonId || null,
        sold,
        month_quoted: toMonthDate(mqMonth, mqYear),
        month_sold: toMonthDate(msMonth, msYear),
        // Parse string inputs back to numbers, null if empty
        squares: squares !== "" ? parseFloat(squares) : null,
        days: days !== "" ? parseFloat(days) : null,
        materials: materials !== "" ? parseFloat(materials) : 0,
        labour: labour !== "" ? parseFloat(labour) : 0,
        disposal: disposal !== "" ? parseFloat(disposal) : 0,
        warranty: warranty !== "" ? parseFloat(warranty) : 0,
        other: other !== "" ? parseFloat(other) : 0,
        gutters: gutters !== "" ? parseFloat(gutters) : 0,
        sales_price: salesPrice !== "" ? parseFloat(salesPrice) : null,
      })

      if (!result.success) {
        alert(result.error)
        return
      }

      // Redirect to /jobs — revalidatePath in the action ensures the
      // newest job appears at the top of the sorted list
      router.push("/jobs")
    })
  }

  const years = getYears()

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Job Address */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Job Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={jobAddress}
          onChange={(e) => setJobAddress(e.target.value)}
          placeholder="123 Main St, Vancouver, BC"
          className="w-full border rounded px-3 py-2 text-sm"
          disabled={isPending}
        />
      </div>

      {/* Division */}
      <div>
        <label className="block text-sm font-medium mb-1">Division</label>
        <select
          value={division}
          onChange={(e) => setDivision(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          disabled={isPending}
        >
          <option value="">— Select division —</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Type of Work */}
      <div>
        <label className="block text-sm font-medium mb-1">Type of Work</label>
        <select
          value={typeOfWork}
          onChange={(e) => setTypeOfWork(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          disabled={isPending}
        >
          <option value="">— Select type —</option>
          {workTypes.map((wt) => (
            <option key={wt.id} value={wt.name}>{wt.name}</option>
          ))}
        </select>
      </div>

      {/* Salesperson */}
      <div>
        <label className="block text-sm font-medium mb-1">Salesperson</label>
        <select
          value={salespersonId}
          onChange={(e) => setSalespersonId(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
          disabled={isPending}
        >
          <option value="">— Select salesperson —</option>
          {salespersons.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name ?? "Unknown"}</option>
          ))}
        </select>
      </div>

      {/* Sold */}
      <div>
        <label className="block text-sm font-medium mb-1">Sold</label>
        <select
          value={sold ? "true" : "false"}
          onChange={(e) => setSold(e.target.value === "true")}
          className="w-full border rounded px-3 py-2 text-sm"
          disabled={isPending}
        >
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </div>

      {/* Month Quoted */}
      <div>
        <label className="block text-sm font-medium mb-1">Month Quoted</label>
        <div className="flex gap-2">
          <select
            value={mqMonth ?? ""}
            onChange={(e) => setMqMonth(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 border rounded px-3 py-2 text-sm"
            disabled={isPending}
          >
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={mqYear ?? ""}
            onChange={(e) => setMqYear(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 border rounded px-3 py-2 text-sm"
            disabled={isPending}
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Sold */}
      <div>
        <label className="block text-sm font-medium mb-1">Month Sold</label>
        <div className="flex gap-2">
          <select
            value={msMonth ?? ""}
            onChange={(e) => setMsMonth(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 border rounded px-3 py-2 text-sm"
            disabled={isPending}
          >
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={msYear ?? ""}
            onChange={(e) => setMsYear(e.target.value ? Number(e.target.value) : null)}
            className="flex-1 border rounded px-3 py-2 text-sm"
            disabled={isPending}
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Squares */}
      <div>
        <label className="block text-sm font-medium mb-1">Squares</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={squares}
          onChange={(e) => setSquares(e.target.value)}
          placeholder="0.00"
          className="w-full border rounded px-3 py-2 text-sm"
          disabled={isPending}
        />
      </div>

      {/* Days */}
      <div>
        <label className="block text-sm font-medium mb-1">Days</label>
        <input
          type="number"
          step="0.5"
          min="0"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder="0.5"
          className="w-full border rounded px-3 py-2 text-sm"
          disabled={isPending}
        />
      </div>

      {/* Cost fields */}
      {(
        [
          { label: "Materials", value: materials, setter: setMaterials },
          { label: "Labour", value: labour, setter: setLabour },
          { label: "Disposal", value: disposal, setter: setDisposal },
          { label: "Warranty", value: warranty, setter: setWarranty },
          { label: "Other (OTH)", value: other, setter: setOther },
          { label: "Gutters", value: gutters, setter: setGutters },
          { label: "Sales Price", value: salesPrice, setter: setSalesPrice },
        ] as const
      ).map(({ label, value, setter }) => (
        <div key={label}>
          <label className="block text-sm font-medium mb-1">{label}</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setter(e.target.value)}
            placeholder="0.00"
            className="w-full border rounded px-3 py-2 text-sm"
            disabled={isPending}
          />
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-black text-white text-sm rounded disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Job"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="px-4 py-2 border text-sm rounded disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

    </form>
  )
}
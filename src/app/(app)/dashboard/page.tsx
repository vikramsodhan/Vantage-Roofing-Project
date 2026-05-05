import { requireActiveProfile } from "@/lib/supabase/getProfile"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardClient from "./_components/DashboardClient"

export default async function DashboardPage() {
  const profile = await requireActiveProfile()

  if (profile.role === "employee") {
    redirect("/jobs")
  }

  const supabase = await createClient()

  const [{ data: jobs }, { data: salespersons }] = await Promise.all([
    supabase
      .from("jobs_with_calculations")
      .select(
        "id, sold, month_sold, sales_price, mgn, squares, salesperson_id, salesperson_name"
      )
      .eq("sold", true),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .neq("full_name", "Unknown")
      .order("full_name"),
  ])

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Sales performance overview</p>
      </div>
      <DashboardClient
        jobs={jobs ?? []}
        salespersons={salespersons ?? []}
      />
    </div>
  )
}
import { createClient } from "@/lib/supabase/server"
import JobForm from "../_components/JobForm"

export default async function NewJobPage() {
  const supabase = await createClient()

  // Fetch all dropdown data in parallel.
  // These three queries run at the same time instead of one after another.
  const [
    { data: divisions },
    { data: workTypes },
    { data: salespersons },
  ] = await Promise.all([
    supabase.from("divisions").select("id, name").order("name"),
    supabase.from("work_types").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
  ])

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Job</h1>
      <JobForm
        divisions={divisions ?? []}
        workTypes={workTypes ?? []}
        salespersons={salespersons ?? []}
      />
    </div>
  )
}
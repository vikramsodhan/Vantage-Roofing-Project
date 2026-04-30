import JobForm from "../_components/JobForm"
import { getJobFormData } from "../_lib/getJobFormData"
import { requireActiveProfile } from "@/lib/supabase/getProfile"

export default async function NewJobPage() {
  const profile = await requireActiveProfile()

  // Fetch all dropdown data in parallel.
  // These three queries run at the same time instead of one after another.
  const { divisions, workTypes, salespersons } = await getJobFormData()

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Job</h1>
      <JobForm
        divisions={divisions ?? []}
        workTypes={workTypes ?? []}
        salespersons={salespersons ?? []}
        currentUserProfile={profile}
      />
    </div>
  )
}
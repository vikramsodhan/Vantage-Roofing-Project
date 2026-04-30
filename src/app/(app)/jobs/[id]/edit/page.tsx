import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import JobForm from "../../_components/JobForm"
import { getJobFormData } from "../../_lib/getJobFormData"
import { requireActiveProfile } from "@/lib/supabase/getProfile"
import { canUserModifyJob } from "@/lib/authorization/jobPermissions"

export default async function EditJobPage( {params}: { params: Promise<{ id: string }> }) {
  const profile = await requireActiveProfile()
  
  const supabase = await createClient()

  const { id: job_id } = await params

  // Fetch all dropdown data in parallel.
  // These three queries run at the same time instead of one after another.
  const [
    { data: jobData },
    { divisions, workTypes, salespersons },
  ] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", job_id).single(),
    getJobFormData(),
  ])

  if (!jobData) notFound()
  
  if (!canUserModifyJob(profile, jobData.salesperson_id)) {
    redirect(`/jobs/${job_id}`) // Redirect unauthorized users back to jobs list
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Job</h1>
      <JobForm
        divisions={divisions ?? []}
        workTypes={workTypes ?? []}
        salespersons={salespersons ?? []}
        currentUserProfile={profile}
        defaultValues={jobData}
      />
    </div>
  )
}
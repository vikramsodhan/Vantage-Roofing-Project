import { createClient } from "@/lib/supabase/server"
import JobTable from "./_components/JobTable"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { requireActiveProfile } from "@/lib/supabase/getProfile"


export default async function JobsPage() {
  const profile = await requireActiveProfile()


  const supabase = await createClient()

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .order("date_entered", { ascending: false })

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">List of Jobs</h1>

        <Button asChild>
          <Link href="/jobs/new">New Job</Link>
        </Button>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4">
          Failed to load jobs: {error.message}
        </p>
      )}

      <JobTable jobs={jobs || []} currentUserProfile={profile}/>
    </div>
  )
}

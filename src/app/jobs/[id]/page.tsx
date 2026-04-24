import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"

export default async function JobDetailPage( {params}: { params: Promise<{ id: string }> }) {

  const { id: job_id } = await params

  const supabase = await createClient()

  const { data: job_data } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single()
  
  if (!job_data) notFound() // If no job found, show 404 page

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Single Job Detail Page</h1>
      <p className="text-gray-500 text-sm">
        Here&apos;s where we&apos;ll view existing job details. {job_id}
      </p>
      <Button asChild>
        <Link href={`/jobs/${job_id}/edit`}>Edit</Link>
      </Button>
      {Object.entries(job_data).map(([key, value]) => (
        <p key={key}>
          <span className="font-medium">{key}:</span> {String(value)}
        </p>
      ))}
    </div>
  )
}
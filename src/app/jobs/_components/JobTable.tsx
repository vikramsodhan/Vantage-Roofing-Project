"use client"

import Link from "next/link"
import type { Job } from "@/types/job"

type JobTableProps = {
  jobs: Job[]
}

export default function JobTable({ jobs }: JobTableProps ) {
  return (
    <div className="space-y-2">
      {jobs.length === 0 && (
        <p className="text-gray-500 text-sm">No jobs found.</p>
      )}

      {jobs.map((job) => (
        <div
          key={job.id}
          className="border p-3 rounded-md bg-white shadow-sm"
        >
          {Object.entries(job).map(([key, value]) => (
            <p key={key} className="text-sm">
              <span className="font-medium">{key}:</span> {String(value)}
            </p>
          ))}
          <Link
            href={`/jobs/${job.id}/edit`}
            className="text-blue-600 text-sm underline mt-1 inline-block"
          >
            Edit
          </Link>
        </div>
      ))}
    </div>
  )
}

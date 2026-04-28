"use client"

import Link from "next/link"
import type { JobWithCalculations, Profile } from "@/types"
import { canUserModifyJob } from "@/lib/authorization/jobPermissions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { DeleteJobButton } from "./DeleteJobButton"

type JobTableProps = {
  jobs: JobWithCalculations[],
  currentUserProfile: Profile
}

export default function JobTable({ jobs, currentUserProfile }: JobTableProps) {
  return (
    <div className="space-y-4">
      {jobs.length === 0 && (
        <p className="text-gray-500 text-sm">No jobs found.</p>
      )}

      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {job.job_address}
              {
                canUserModifyJob(currentUserProfile, job.salesperson_id) && (
                  // To-do remove the "!" once view id is set to not null in supabase
                  <DeleteJobButton jobId={job.id!} />
                )
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {Object.entries(job).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{key}</TableCell>
                    <TableCell>{String(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href={`/jobs/${job.id}`}>View</Link>
              </Button>
              {
                canUserModifyJob(currentUserProfile, job.salesperson_id) && (
                  <Button asChild variant="outline">
                    <Link href={`/jobs/${job.id}/edit`}>Edit</Link>
                  </Button>
                )
              }
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

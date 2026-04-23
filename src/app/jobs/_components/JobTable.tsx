"use client"

import Link from "next/link"
import type { Job } from "@/types/job"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

type JobTableProps = {
  jobs: Job[]
}

export default function JobTable({ jobs }: JobTableProps) {
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
                <Link href={`/jobs/${job.id}/edit`}>Edit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

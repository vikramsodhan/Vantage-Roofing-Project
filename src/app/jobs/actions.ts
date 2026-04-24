"use server"

/**
 * src/app/(app)/jobs/actions.ts — Jobs Server Actions
 *
 * "use server" at the top means every exported function here is a
 * server action. They run on the server but are called from client
 * components as if they were normal functions.
 *
 * Why this file exists instead of an API route:
 * Instead of: fetch("/api/jobs", { method: "POST", body: JSON.stringify(data) })
 * You just:   await createJob(data)
 *
 * Next.js handles the network round-trip invisibly.
 * Your Supabase credentials never touch the browser.
 *
 * Return shape:
 * We always return { success: true/false } so the client component
 * can check what happened and show the right message.
 * We never throw from a server action — thrown errors don't reach
 * the client cleanly, so we catch them and return { success: false }.
 */

import { createClient } from "@/lib/supabase/server"
import type { JobInsert, JobUpdate } from "@/types"

type ActionResult =
  | { success: true; id: string }
  | { success: false; error: string }

export async function createJob(payloadData: JobInsert): Promise<ActionResult> {
  // 1. Get the authenticated user — never trust data from the client
  //    to know who is submitting. Always read it from the server session.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to create a job." }
  }

  // 2. Confirm the user is still active
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single()

  if (!profile?.is_active) {
    return { success: false, error: "Your account is inactive." }
  }

  // 3. Insert — always stamp entered_by with the real server-side user ID.
  //    Even if the client sends a different entered_by value, we overwrite it
  //    here so it can't be spoofed.
  const {data, error} = await supabase
    .from("jobs")
    .insert({ ...payloadData, entered_by: user.id })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, id: data.id }
}


export async function updateJob(payloadData: JobUpdate, id: string): Promise<ActionResult> {
  // 1. Get the authenticated user — never trust data from the client
  //    to know who is submitting. Always read it from the server session.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to create a job." }
  }

  // 2. Confirm the user is still active
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single()

  if (!profile?.is_active) {
    return { success: false, error: "Your account is inactive." }
  }

  // 3. Update — always stamp entered_by with the real server-side user ID.
  //    Even if the client sends a different entered_by value, we overwrite it
  //    here so it can't be spoofed.
  const { error } = await supabase
    .from("jobs")
    .update({ ...payloadData, entered_by: user.id })
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, id }
}
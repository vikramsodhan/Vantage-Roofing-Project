import { createClient } from "@/lib/supabase/server"

export async function getJobFormData() {
  const supabase = await createClient()

  const [
    { data: divisions },
    { data: workTypes },
    { data: salespersons },
  ] = await Promise.all([
    supabase.from("divisions").select("id, name").eq("is_default", false).order("name"),
    supabase.from("work_types").select("id, name").eq("is_default", false).order("name"),
    supabase.from("profiles").select("id, full_name").eq("is_active", true).order("full_name"),
  ])

  return {
    divisions: divisions ?? [],
    workTypes: workTypes ?? [],
    salespersons: salespersons ?? [],
  }
}
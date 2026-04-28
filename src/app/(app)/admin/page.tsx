import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/getProfile'
import { createClient } from '@/lib/supabase/server'
import UserTable from './_components/UserTable'
import AdminSettings from './_components/AdminSettings'

export default async function AdminPage() {
  const profile = await getProfile()

  if (!profile || profile.role !== 'owner') {
    redirect('/jobs')
  }

  const supabase = await createClient()

  const [
    { data: users },
    { data: divisions },
    { data: workTypes },
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('divisions').select('*').order('name'),
    supabase.from('work_types').select('*').order('name'),
  ])

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <UserTable users={users ?? []} currentUserId={profile.id} />
      <AdminSettings divisions={divisions ?? []} workTypes={workTypes ?? []} />
    </div>
  )
}
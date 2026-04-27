import { redirect } from 'next/navigation'
import { requireActiveProfile } from '@/lib/supabase/getProfile'

export default async function AdminPage() {
  const profile = await requireActiveProfile()

  if (!profile || profile.role !== 'owner') {
    redirect('/jobs')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Admin</h1>
      {/* User management and settings UI goes here */}
    </div>
  )
}
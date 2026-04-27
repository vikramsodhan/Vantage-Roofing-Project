import { Role } from "@/types"
import Sidebar from "./_layout/Sidebar"
import { requireActiveProfile } from "@/lib/supabase/getProfile"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireActiveProfile()

  return (
    <div className="flex min-h-screen">
      <Sidebar role={(profile.role ?? 'employee') as Role} />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  )
}
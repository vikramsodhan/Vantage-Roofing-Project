"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Role } from "@/types";

interface SidebarProps {
  role: Role
}

export default function Sidebar({ role }: SidebarProps ) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="w-48 border-r border-gray-300 p-4 flex flex-col justify-between min-h-screen">
      <ul className="space-y-2">
        <li>
          <Link href="/" className="text-blue-600">Home</Link>
        </li>
        <li>
          <Link href="/jobs" className="text-blue-600">Jobs</Link>
        </li>
        <li>
          <Link href="/jobs/new" className="text-blue-600">New Job</Link>
        </li>
        {role === 'owner' && (
          <li>
            <Link href="/admin" className="text-blue-600">Admin</Link>
          </li>
        )}
      </ul>

      <Button variant="outline" onClick={handleSignOut}>
        Sign out
      </Button>
    </nav>
  )
}


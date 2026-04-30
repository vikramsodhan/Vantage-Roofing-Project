'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/getProfile'
import type { Role } from '@/types'

async function requireOwner() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'owner') {
    throw new Error('Unauthorized')
  }
}

export async function updateRole(userId: string, role: Role) {
  await requireOwner()
  const supabase = await createClient()
  await supabase.from('profiles').update({ role }).eq('id', userId)
  revalidatePath('/admin')
}

export async function toggleActive(userId: string, isActive: boolean) {
  await requireOwner()
  const supabase = await createClient()
  await supabase.from('profiles').update({ is_active: isActive }).eq('id', userId)
  revalidatePath('/admin')
}

export async function addDivision(name: string) {
  await requireOwner()
  const supabase = await createClient()
  await supabase.from('divisions').insert({ name })
  revalidatePath('/admin')
}

export async function deleteDivision(id: string) {
  await requireOwner()
  const supabase = await createClient()
  const { error } = await supabase.from('divisions').delete().eq('id', id)
  if (error) throw new Error('Cannot delete — this division may be in use by existing jobs.')
  revalidatePath('/admin')
}

export async function addWorkType(name: string) {
  await requireOwner()
  const supabase = await createClient()
  await supabase.from('work_types').insert({ name })
  revalidatePath('/admin')
}

export async function deleteWorkType(id: string) {
  await requireOwner()
  const supabase = await createClient()

  const { data: workType } = await supabase
    .from('work_types')
    .select('is_default')
    .eq('id', id)
    .single()

  if (workType?.is_default) throw new Error('The default work type cannot be deleted.')

  const { error } = await supabase.from('work_types').delete().eq('id', id)
  if (error) throw new Error('Cannot delete — this work type may be in use by existing jobs.')
  revalidatePath('/admin')
}
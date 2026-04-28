import type { Job, Profile } from "@/types"

export function canUserModifyJob(profile: Profile, job: Job) {
    
    if (profile.role === 'owner') {
      return true
    }
    if (profile.role === 'manager') {
      return true
    }
    if (profile.id === job.salesperson_id) {
      return true
    }
    return false
  
}

import type { Job, Profile } from "@/types"

export function canUserModifyJob(profile: Profile, job: Job) {
    return(
      profile.role === 'owner' || 
      profile.role === 'manager' || 
      profile.id === job.salesperson_id
    )  
}

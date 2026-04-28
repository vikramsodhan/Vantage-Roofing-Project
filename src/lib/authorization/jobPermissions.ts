import type { Profile } from "@/types"

export function canUserModifyJob(profile: Profile, salespersonId: string | null) {
    // To-do remove the ability for salespersonID to be null id is set to not null in supabase
    return(
      profile.role === 'owner' || 
      profile.role === 'manager' || 
      profile.id === salespersonId
    )  
}

export function canChangeSalesperson(profile: Profile) {
    return( profile.role === 'owner' || profile.role === 'manager')  
}
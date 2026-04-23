import type { Database } from "./database.types"

export type Job = Database["public"]["Tables"]["jobs"]["Row"]

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Division = Database["public"]["Tables"]["divisions"]["Row"]
export type WorkType = Database["public"]["Tables"]["work_types"]["Row"]

export type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"]
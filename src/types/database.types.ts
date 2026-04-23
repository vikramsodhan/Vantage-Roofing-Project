export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      divisions: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          date_entered: string | null
          days: number | null
          disposal: number | null
          division: string | null
          entered_by: string | null
          gutters: number | null
          id: string
          job_address: string
          labour: number | null
          materials: number | null
          month_quoted: string | null
          month_sold: string | null
          other: number | null
          sales_price: number | null
          salesperson_id: string | null
          sold: boolean | null
          squares: number | null
          type_of_work: string | null
          updated_at: string | null
          warranty: number | null
        }
        Insert: {
          date_entered?: string | null
          days?: number | null
          disposal?: number | null
          division?: string | null
          entered_by?: string | null
          gutters?: number | null
          id?: string
          job_address: string
          labour?: number | null
          materials?: number | null
          month_quoted?: string | null
          month_sold?: string | null
          other?: number | null
          sales_price?: number | null
          salesperson_id?: string | null
          sold?: boolean | null
          squares?: number | null
          type_of_work?: string | null
          updated_at?: string | null
          warranty?: number | null
        }
        Update: {
          date_entered?: string | null
          days?: number | null
          disposal?: number | null
          division?: string | null
          entered_by?: string | null
          gutters?: number | null
          id?: string
          job_address?: string
          labour?: number | null
          materials?: number | null
          month_quoted?: string | null
          month_sold?: string | null
          other?: number | null
          sales_price?: number | null
          salesperson_id?: string | null
          sold?: boolean | null
          squares?: number | null
          type_of_work?: string | null
          updated_at?: string | null
          warranty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "jobs_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_type_of_work_fkey"
            columns: ["type_of_work"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["name"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: string | null
        }
        Relationships: []
      }
      work_types: {
        Row: {
          created_at: string | null
          id: string
          is_misc: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_misc?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_misc?: boolean | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      jobs_with_calculations: {
        Row: {
          date_entered: string | null
          days: number | null
          disposal: number | null
          division: string | null
          dollar_per_square: number | null
          ee_mgn_per_day: number | null
          entered_by: string | null
          gutters: number | null
          id: string | null
          job_address: string | null
          labour: number | null
          materials: number | null
          mgn: number | null
          mgn_per_day: number | null
          month_quoted: string | null
          month_sold: string | null
          other: number | null
          sales_price: number | null
          salesperson_id: string | null
          salesperson_name: string | null
          sold: boolean | null
          squares: number | null
          total_cost_percent: number | null
          total_job_cost: number | null
          type_of_work: string | null
          updated_at: string | null
          warranty: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "jobs_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_type_of_work_fkey"
            columns: ["type_of_work"]
            isOneToOne: false
            referencedRelation: "work_types"
            referencedColumns: ["name"]
          },
        ]
      }
    }
    Functions: {
      is_active_user: { Args: never; Returns: boolean }
      is_manager_or_owner: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          brand_id: string | null
          budget: number
          budget_breakpoints: number[] | null
          created_at: string | null
          created_by: string
          current_breakpoint_index: number | null
          description: string
          end_date: string
          id: string
          rate_per_1000_views: number
          start_date: string
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          total_paid: number
          tutorial_url: string | null
          tutorial_video_url: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          budget?: number
          budget_breakpoints?: number[] | null
          created_at?: string | null
          created_by: string
          current_breakpoint_index?: number | null
          description: string
          end_date: string
          id?: string
          rate_per_1000_views: number
          start_date: string
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          total_paid?: number
          tutorial_url?: string | null
          tutorial_video_url?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          budget?: number
          budget_breakpoints?: number[] | null
          created_at?: string | null
          created_by?: string
          current_breakpoint_index?: number | null
          description?: string
          end_date?: string
          id?: string
          rate_per_1000_views?: number
          start_date?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          total_paid?: number
          tutorial_url?: string | null
          tutorial_video_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          message: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          message: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          message?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_chat_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          stripe_connect_id: string | null
          stripe_connect_onboarded: boolean | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          asset_url: string
          campaign_id: string
          created_at: string | null
          id: string
          payout_amount: number | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          status: Database["public"]["Enums"]["submission_status"] | null
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          asset_url: string
          campaign_id: string
          created_at?: string | null
          id?: string
          payout_amount?: number | null
          platform?: Database["public"]["Enums"]["platform_type"] | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          updated_at?: string | null
          user_id: string
          views?: number | null
        }
        Update: {
          asset_url?: string
          campaign_id?: string
          created_at?: string | null
          id?: string
          payout_amount?: number | null
          platform?: Database["public"]["Enums"]["platform_type"] | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      view_history: {
        Row: {
          created_at: string | null
          id: string
          paid: boolean
          submission_id: string
          tracked_at: string
          updated_at: string | null
          view_count: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          paid?: boolean
          submission_id: string
          tracked_at?: string
          updated_at?: string | null
          view_count: number
        }
        Update: {
          created_at?: string | null
          id?: string
          paid?: boolean
          submission_id?: string
          tracked_at?: string
          updated_at?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "view_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_campaign_dates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_if_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_submissions_with_profiles: {
        Args: { campaign_id_param: string; status_param: string }
        Returns: {
          id: string
          campaign_id: string
          user_id: string
          asset_url: string
          status: string
          views: number
          payout_amount: number
          created_at: string
          updated_at: string
          email: string
        }[]
      }
      process_payout: {
        Args: {
          submission_id: string
          view_count: number
          payout_amount: number
        }
        Returns: boolean
      }
      track_new_views: {
        Args: {
          p_submission_id: string
          p_current_views: number
          p_view_difference: number
        }
        Returns: undefined
      }
    }
    Enums: {
      campaign_status:
        | "pending_funding"
        | "funded_but_not_started"
        | "active"
        | "paused_at_breakpoint"
        | "paused_by_admin"
        | "completed"
        | "expired"
      platform_type: "tiktok" | "youtube" | "instagram"
      submission_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_status: [
        "pending_funding",
        "funded_but_not_started",
        "active",
        "paused_at_breakpoint",
        "paused_by_admin",
        "completed",
        "expired",
      ],
      platform_type: ["tiktok", "youtube", "instagram"],
      submission_status: ["pending", "approved", "rejected"],
    },
  },
} as const

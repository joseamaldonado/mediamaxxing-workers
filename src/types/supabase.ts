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
          end_date: string | null
          id: string
          links: string[] | null
          payout_max_per_submission: number
          payout_min_per_submission: number
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
          end_date?: string | null
          id?: string
          links?: string[] | null
          payout_max_per_submission?: number
          payout_min_per_submission?: number
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
          end_date?: string | null
          id?: string
          links?: string[] | null
          payout_max_per_submission?: number
          payout_min_per_submission?: number
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
          {
            foreignKeyName: "campaign_chat_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_with_calculated_totals"
            referencedColumns: ["id"]
          },
        ]
      }
      comments_history: {
        Row: {
          comments_count: number
          created_at: string | null
          id: string
          submission_id: string
          tracked_at: string
          updated_at: string | null
        }
        Insert: {
          comments_count: number
          created_at?: string | null
          id?: string
          submission_id: string
          tracked_at?: string
          updated_at?: string | null
        }
        Update: {
          comments_count?: number
          created_at?: string | null
          id?: string
          submission_id?: string
          tracked_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_with_earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_with_earnings_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      likes_history: {
        Row: {
          created_at: string | null
          id: string
          likes_count: number
          submission_id: string
          tracked_at: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          likes_count: number
          submission_id: string
          tracked_at?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          likes_count?: number
          submission_id?: string
          tracked_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "likes_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_with_earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_with_earnings_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_by: string
          message_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_by: string
          message_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_by?: string
          message_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_mentioned_by_fkey"
            columns: ["mentioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          baseline_views: number
          campaign_id: string
          created_at: string | null
          description: string | null
          highest_unpaid_view: number
          id: string
          rate_per_view: number
          stripe_connect_id: string
          stripe_transfer_id: string
          submission_id: string
          updated_at: string | null
          user_id: string
          views_paid: number
        }
        Insert: {
          amount: number
          baseline_views?: number
          campaign_id: string
          created_at?: string | null
          description?: string | null
          highest_unpaid_view: number
          id?: string
          rate_per_view: number
          stripe_connect_id: string
          stripe_transfer_id: string
          submission_id: string
          updated_at?: string | null
          user_id: string
          views_paid: number
        }
        Update: {
          amount?: number
          baseline_views?: number
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          highest_unpaid_view?: number
          id?: string
          rate_per_view?: number
          stripe_connect_id?: string
          stripe_transfer_id?: string
          submission_id?: string
          updated_at?: string | null
          user_id?: string
          views_paid?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_with_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_with_earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_with_earnings_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paypals: {
        Row: {
          address: string | null
          country: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_primary: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          country: string
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          country?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paypals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country_code: string | null
          created_at: string | null
          discord_username: string | null
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          marketing_consent: boolean | null
          pfp_url: string | null
          stripe_connect_id: string | null
          stripe_connect_onboarded: boolean | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          discord_username?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          marketing_consent?: boolean | null
          pfp_url?: string | null
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          discord_username?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          marketing_consent?: boolean | null
          pfp_url?: string | null
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
          comments: number | null
          created_at: string | null
          id: string
          likes: number | null
          payout_amount: number | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          status: Database["public"]["Enums"]["submission_status"] | null
          updated_at: string | null
          user_id: string
          views: number | null
          was_approved: boolean
        }
        Insert: {
          asset_url: string
          campaign_id: string
          comments?: number | null
          created_at?: string | null
          id?: string
          likes?: number | null
          payout_amount?: number | null
          platform?: Database["public"]["Enums"]["platform_type"] | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          updated_at?: string | null
          user_id: string
          views?: number | null
          was_approved?: boolean
        }
        Update: {
          asset_url?: string
          campaign_id?: string
          comments?: number | null
          created_at?: string | null
          id?: string
          likes?: number | null
          payout_amount?: number | null
          platform?: Database["public"]["Enums"]["platform_type"] | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          updated_at?: string | null
          user_id?: string
          views?: number | null
          was_approved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_with_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          {
            foreignKeyName: "view_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_with_earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "view_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions_with_earnings_admin"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      campaign_payment_summary: {
        Row: {
          campaign_id: string | null
          campaign_title: string | null
          first_payment: string | null
          last_payment: string | null
          total_paid: number | null
          total_payments: number | null
          total_views_paid: number | null
          unique_creators_paid: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_with_calculated_totals"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns_with_calculated_totals: {
        Row: {
          brand_id: string | null
          budget: number | null
          budget_breakpoints: number[] | null
          calculated_total_paid: number | null
          created_at: string | null
          created_by: string | null
          current_breakpoint_index: number | null
          description: string | null
          end_date: string | null
          id: string | null
          links: string[] | null
          payout_max_per_submission: number | null
          payout_min_per_submission: number | null
          rate_per_1000_views: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          title: string | null
          total_paid: number | null
          tutorial_url: string | null
          tutorial_video_url: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          budget?: number | null
          budget_breakpoints?: number[] | null
          calculated_total_paid?: never
          created_at?: string | null
          created_by?: string | null
          current_breakpoint_index?: number | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          links?: string[] | null
          payout_max_per_submission?: number | null
          payout_min_per_submission?: number | null
          rate_per_1000_views?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          title?: string | null
          total_paid?: number | null
          tutorial_url?: string | null
          tutorial_video_url?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          budget?: number | null
          budget_breakpoints?: number[] | null
          calculated_total_paid?: never
          created_at?: string | null
          created_by?: string | null
          current_breakpoint_index?: number | null
          description?: string | null
          end_date?: string | null
          id?: string | null
          links?: string[] | null
          payout_max_per_submission?: number | null
          payout_min_per_submission?: number | null
          rate_per_1000_views?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          title?: string | null
          total_paid?: number | null
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
      daily_payment_stats: {
        Row: {
          avg_payment_amount: number | null
          payment_date: string | null
          payments_count: number | null
          total_amount: number | null
          total_views_paid: number | null
          unique_campaigns: number | null
          unique_creators: number | null
        }
        Relationships: []
      }
      payment_summary: {
        Row: {
          discord_username: string | null
          email: string | null
          first_payment: string | null
          last_payment: string | null
          total_earned: number | null
          total_payments: number | null
          total_views_paid: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions_with_earnings: {
        Row: {
          asset_url: string | null
          calculated_earnings: number | null
          campaign_id: string | null
          comments: number | null
          created_at: string | null
          display_status:
            | Database["public"]["Enums"]["submission_status"]
            | null
          id: string | null
          likes: number | null
          payout_amount: number | null
          payout_max_per_submission: number | null
          payout_min_per_submission: number | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          rate_per_1000_views: number | null
          status: Database["public"]["Enums"]["submission_status"] | null
          updated_at: string | null
          user_id: string | null
          views: number | null
          was_approved: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_with_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions_with_earnings_admin: {
        Row: {
          asset_url: string | null
          calculated_earnings: number | null
          campaign_id: string | null
          comments: number | null
          created_at: string | null
          id: string | null
          likes: number | null
          payout_amount: number | null
          payout_max_per_submission: number | null
          payout_min_per_submission: number | null
          platform: Database["public"]["Enums"]["platform_type"] | null
          rate_per_1000_views: number | null
          status: Database["public"]["Enums"]["submission_status"] | null
          updated_at: string | null
          user_id: string | null
          views: number | null
          was_approved: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns_with_calculated_totals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_submission_earnings: {
        Args: {
          submission_views: number
          campaign_rate: number
          campaign_min: number
          campaign_max: number
          current_payout?: number
        }
        Returns: number
      }
      check_campaign_dates: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_if_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      create_mention_notification: {
        Args: {
          p_recipient_id: string
          p_sender_id: string
          p_message: string
          p_chat_id: string
        }
        Returns: string
      }
      get_campaign_calculated_total: {
        Args: { campaign_id_param: string }
        Returns: number
      }
      get_submissions_with_earnings_and_profiles: {
        Args: { campaign_id_param: string; status_param?: string }
        Returns: {
          id: string
          campaign_id: string
          user_id: string
          asset_url: string
          status: string
          views: number
          likes: number
          comments: number
          payout_amount: number
          calculated_earnings: number
          created_at: string
          updated_at: string
          email: string
          discord_username: string
          country_code: string
          platform: string
        }[]
      }
      get_submissions_with_earnings_and_profiles_admin: {
        Args: { campaign_id_param: string; status_param?: string }
        Returns: {
          id: string
          campaign_id: string
          user_id: string
          asset_url: string
          status: string
          views: number
          likes: number
          comments: number
          payout_amount: number
          calculated_earnings: number
          created_at: string
          updated_at: string
          email: string
          discord_username: string
          country_code: string
          platform: string
        }[]
      }
      get_submissions_with_profiles: {
        Args: { campaign_id_param: string; status_param?: string }
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
          discord_username: string
          country_code: string
        }[]
      }
      process_payout: {
        Args:
          | { p_view_history_id: string }
          | { submission_id: string; view_count: number; payout_amount: number }
        Returns: boolean
      }
      track_new_comments: {
        Args: {
          p_submission_id: string
          p_current_comments: number
          p_comments_difference: number
        }
        Returns: undefined
      }
      track_new_likes: {
        Args: {
          p_submission_id: string
          p_current_likes: number
          p_likes_difference: number
        }
        Returns: undefined
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

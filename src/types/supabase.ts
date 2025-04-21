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
      campaigns: {
        Row: {
          active: boolean | null
          budget: number
          created_at: string | null
          created_by: string
          description: string
          end_date: string
          funded: boolean
          id: string
          rate_per_1000_views: number
          start_date: string
          title: string
          total_paid: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          budget?: number
          created_at?: string | null
          created_by: string
          description: string
          end_date: string
          funded?: boolean
          id?: string
          rate_per_1000_views: number
          start_date: string
          title: string
          total_paid?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          budget?: number
          created_at?: string | null
          created_by?: string
          description?: string
          end_date?: string
          funded?: boolean
          id?: string
          rate_per_1000_views?: number
          start_date?: string
          title?: string
          total_paid?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean | null
          stripe_connect_id: string | null
          stripe_connect_onboarded: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          is_admin?: boolean | null
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean | null
          updated_at?: string | null
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
      check_if_admin: {
        Args: { user_id: string }
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
      platform_type: "tiktok" | "youtube" | "instagram"
      submission_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Helper types for the UI
export type Campaign = Tables<'campaigns'>
export type Submission = Tables<'submissions'>
export type Profile = Tables<'profiles'>
export type ViewHistory = Tables<'view_history'>
export type SubmissionStatus = Enums<'submission_status'>
export type PlatformType = Enums<'platform_type'> 
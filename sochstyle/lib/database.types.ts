export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      barbers: {
        Row: { // The data expected to be returned from a "select" statement.
          id: string
          name: string
          avatar_url: string | null
          cover_url: string | null
          phone: string | null
          district: string | null
          address: string | null
          lat: number | null
          lng: number | null
          min_price: number | null
          max_price: number | null
          rating: number | null
          review_count: number | null
          is_home_service: boolean | null
        }
        Insert: { // The data expected passed to an "insert" statement.
          id?: string
          name: string
          avatar_url?: string | null
          cover_url?: string | null
          phone?: string | null
          district?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          min_price?: number | null
          max_price?: number | null
          rating?: number | null
          review_count?: number | null
          is_home_service?: boolean | null
        }
        Update: { // The data expected passed to an "update" statement.
          id?: string
          name?: string
          avatar_url?: string | null
          cover_url?: string | null
          phone?: string | null
          district?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          min_price?: number | null
          max_price?: number | null
          rating?: number | null
          review_count?: number | null
          is_home_service?: boolean | null
        }
      }
      // ... other tables
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

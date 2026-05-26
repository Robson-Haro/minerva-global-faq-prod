export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Lang = 'pt' | 'en' | 'es'
type Role = 'admin' | 'user'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: Role
          department: string | null
          country: string | null
          language_preference: Lang
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: Role
          department?: string | null
          country?: string | null
          language_preference?: Lang
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: Role
          department?: string | null
          country?: string | null
          language_preference?: Lang
          created_at?: string
          updated_at?: string
        }
      }
      themes: {
        Row: {
          id: string
          title_pt: string
          title_en: string
          title_es: string
          description_pt: string | null
          description_en: string | null
          description_es: string | null
          icon: string | null
          sort_order: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title_pt: string
          title_en: string
          title_es: string
          description_pt?: string | null
          description_en?: string | null
          description_es?: string | null
          icon?: string | null
          sort_order?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title_pt?: string
          title_en?: string
          title_es?: string
          description_pt?: string | null
          description_en?: string | null
          description_es?: string | null
          icon?: string | null
          sort_order?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      faqs: {
        Row: {
          id: string
          theme_id: string | null
          question_pt: string
          question_en: string
          question_es: string
          answer_pt: string
          answer_en: string
          answer_es: string
          tags: string[] | null
          sort_order: number
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          theme_id?: string | null
          question_pt: string
          question_en: string
          question_es: string
          answer_pt: string
          answer_en: string
          answer_es: string
          tags?: string[] | null
          sort_order?: number
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          theme_id?: string | null
          question_pt?: string
          question_en?: string
          question_es?: string
          answer_pt?: string
          answer_en?: string
          answer_es?: string
          tags?: string[] | null
          sort_order?: number
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string | null
          session_id: string
          event_type: 'theme_opened' | 'question_opened' | 'question'
          query_text: string | null
          detected_language: Lang
          country: string | null
          theme_id: string | null
          faq_matched_id: string | null
          confidence: number | null
          was_helpful: boolean | null
          feedback_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id: string
          event_type?: 'theme_opened' | 'question_opened' | 'question'
          query_text?: string | null
          detected_language?: Lang
          country?: string | null
          theme_id?: string | null
          faq_matched_id?: string | null
          confidence?: number | null
          was_helpful?: boolean | null
          feedback_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string
          event_type?: 'theme_opened' | 'question_opened' | 'question'
          query_text?: string | null
          detected_language?: Lang
          country?: string | null
          theme_id?: string | null
          faq_matched_id?: string | null
          confidence?: number | null
          was_helpful?: boolean | null
          feedback_text?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      analytics_popular_faqs: {
        Row: {
          id: string
          theme_id: string | null
          question_pt: string
          question_en: string
          question_es: string
          times_accessed: number
          helpful_count: number
          not_helpful_count: number
        }
      }
      analytics_theme_usage: {
        Row: {
          id: string
          title_pt: string
          title_en: string
          title_es: string
          times_accessed: number
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

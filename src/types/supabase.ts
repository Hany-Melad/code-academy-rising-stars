export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          age: number | null
          phone: string
          location: string | null
          role: 'student' | 'admin'
          total_points: number
          unique_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          age?: number | null
          phone: string
          location?: string | null
          role?: 'student' | 'admin'
          total_points?: number
          unique_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          age?: number | null
          phone?: string
          location?: string | null
          role?: 'student' | 'admin'
          total_points?: number
          unique_id?: string | null
          created_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          total_sessions: number
          co_admin_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          total_sessions: number
          co_admin_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          total_sessions?: number
          co_admin_id?: string | null
          created_at?: string
        }
      }
      low_session_alerts: {
        Row: {
          id: string
          student_id: string
          student_name: string
          student_unique_id: string | null
          student_email: string
          student_phone: string | null
          remaining_sessions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          student_name: string
          student_unique_id?: string | null
          student_email: string
          student_phone?: string | null
          remaining_sessions: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          student_name?: string
          student_unique_id?: string | null
          student_email?: string
          student_phone?: string | null
          remaining_sessions?: number
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          course_id: string
          title: string
          order_number: number
          video_url: string | null
          material_url: string | null
          visible: boolean
          locked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          order_number: number
          video_url?: string | null
          material_url?: string | null
          visible?: boolean
          locked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          order_number?: number
          video_url?: string | null
          material_url?: string | null
          visible?: boolean
          locked?: boolean
          created_at?: string
        }
      }
      student_courses: {
        Row: {
          id: string
          student_id: string
          course_id: string
          progress: number
          assigned_at: string
          assigned_by: string | null
          completed_at: string | null
          hide_new_sessions: boolean
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          progress?: number
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          hide_new_sessions?: boolean
        }
        Update: {
          id?: string
          student_id?: string
          course_id?: string
          progress?: number
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          hide_new_sessions?: boolean
        }
      }
      student_course_subscription: {
        Row: {
          id: string
          student_course_id: string
          remaining_sessions: number
          total_sessions: number
          plan_duration_months: number
          warning: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_course_id: string
          remaining_sessions?: number
          total_sessions?: number
          plan_duration_months: number
          warning?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_course_id?: string
          remaining_sessions?: number
          total_sessions?: number
          plan_duration_months?: number
          warning?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      student_sessions: {
        Row: {
          id: string
          student_id: string
          session_id: string
          completed: boolean
          score: number | null
          earned_points: number | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          session_id: string
          completed?: boolean
          score?: number | null
          earned_points?: number | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          session_id?: string
          completed?: boolean
          score?: number | null
          earned_points?: number | null
          completed_at?: string | null
        }
      }
      quizzes: {
        Row: {
          id: string
          session_id: string
          question: string
          options: Json
          correct_answer: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question: string
          options: Json
          correct_answer: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question?: string
          options?: Json
          correct_answer?: string
          created_at?: string
        }
      }
      quiz_results: {
        Row: {
          id: string
          student_id: string
          quiz_id: string
          is_correct: boolean
          answered_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          quiz_id: string
          is_correct: boolean
          answered_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          quiz_id?: string
          is_correct?: boolean
          answered_at?: string | null
        }
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          badge_name: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          badge_name: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          badge_name?: string
        }
      }
      student_achievements: {
        Row: {
          id: string
          student_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          student_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type StudentCourse = Database['public']['Tables']['student_courses']['Row']
export type StudentSession = Database['public']['Tables']['student_sessions']['Row']
export type Quiz = Database['public']['Tables']['quizzes']['Row']
export type QuizResult = Database['public']['Tables']['quiz_results']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type StudentAchievement = Database['public']['Tables']['student_achievements']['Row']
export type LowSessionAlert = Database['public']['Tables']['low_session_alerts']['Row']

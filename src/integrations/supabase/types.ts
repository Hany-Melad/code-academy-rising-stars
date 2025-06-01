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
      achievements: {
        Row: {
          badge_name: string
          description: string
          id: string
          title: string
        }
        Insert: {
          badge_name: string
          description: string
          id?: string
          title: string
        }
        Update: {
          badge_name?: string
          description?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      admin_courses: {
        Row: {
          admin_id: string
          course_id: string
          created_at: string
          id: string
        }
        Insert: {
          admin_id: string
          course_id: string
          created_at?: string
          id?: string
        }
        Update: {
          admin_id?: string
          course_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_courses_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          background_color: string | null
          certificate_date: string
          certificate_text: string
          course_name: string
          created_at: string | null
          footer_image_url: string | null
          header_image_url: string | null
          id: string
          is_visible: boolean
          logo_image_url: string | null
          primary_color: string | null
          ribbon_image_url: string | null
          secondary_color: string | null
        }
        Insert: {
          background_color?: string | null
          certificate_date: string
          certificate_text: string
          course_name: string
          created_at?: string | null
          footer_image_url?: string | null
          header_image_url?: string | null
          id?: string
          is_visible?: boolean
          logo_image_url?: string | null
          primary_color?: string | null
          ribbon_image_url?: string | null
          secondary_color?: string | null
        }
        Update: {
          background_color?: string | null
          certificate_date?: string
          certificate_text?: string
          course_name?: string
          created_at?: string | null
          footer_image_url?: string | null
          header_image_url?: string | null
          id?: string
          is_visible?: boolean
          logo_image_url?: string | null
          primary_color?: string | null
          ribbon_image_url?: string | null
          secondary_color?: string | null
        }
        Relationships: []
      }
      course_group_students: {
        Row: {
          created_at: string
          group_id: string
          id: string
          student_course_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          student_course_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          student_course_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_group_students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "course_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_group_students_student_course_id_fkey"
            columns: ["student_course_id"]
            isOneToOne: false
            referencedRelation: "student_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_group_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_groups: {
        Row: {
          allowed_admin_id: string | null
          branch: string | null
          course_id: string
          created_at: string
          created_by: string
          id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          allowed_admin_id?: string | null
          branch?: string | null
          course_id: string
          created_at?: string
          created_by: string
          id?: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          allowed_admin_id?: string | null
          branch?: string | null
          course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_groups_allowed_admin_id_fkey"
            columns: ["allowed_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_groups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          total_sessions: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          total_sessions?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          total_sessions?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          email: string
          id: string
          location: string | null
          name: string
          phone: string | null
          role: string
          total_points: number
          unique_id: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          email: string
          id: string
          location?: string | null
          name: string
          phone?: string | null
          role?: string
          total_points?: number
          unique_id?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          role?: string
          total_points?: number
          unique_id?: string | null
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean
          quiz_id: string
          student_id: string
          written_answer: string | null
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct: boolean
          quiz_id: string
          student_id: string
          written_answer?: string | null
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          quiz_id?: string
          student_id?: string
          written_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: Json
          points: number
          question: string
          question_type: string
          session_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options: Json
          points?: number
          question: string
          question_type?: string
          session_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json
          points?: number
          question?: string
          question_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          course_id: string
          created_at: string
          id: string
          locked: boolean
          material_url: string | null
          order_number: number
          title: string
          video_url: string | null
          visible: boolean
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          locked?: boolean
          material_url?: string | null
          order_number: number
          title: string
          video_url?: string | null
          visible?: boolean
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          locked?: boolean
          material_url?: string | null
          order_number?: number
          title?: string
          video_url?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          student_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          student_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_achievements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_certificates: {
        Row: {
          certificate_id: string
          created_at: string | null
          download_count: number
          id: string
          student_name: string | null
          student_unique_id: string
        }
        Insert: {
          certificate_id: string
          created_at?: string | null
          download_count?: number
          id?: string
          student_name?: string | null
          student_unique_id: string
        }
        Update: {
          certificate_id?: string
          created_at?: string | null
          download_count?: number
          id?: string
          student_name?: string | null
          student_unique_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_certificate"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_student_profile"
            columns: ["student_unique_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["unique_id"]
          },
        ]
      }
      student_course_subscription: {
        Row: {
          created_at: string
          id: string
          plan_duration_months: number
          remaining_sessions: number
          student_course_id: string
          total_sessions: number
          updated_at: string
          warning: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          plan_duration_months?: number
          remaining_sessions?: number
          student_course_id: string
          total_sessions?: number
          updated_at?: string
          warning?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          plan_duration_months?: number
          remaining_sessions?: number
          student_course_id?: string
          total_sessions?: number
          updated_at?: string
          warning?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "student_course_subscription_student_course_id_fkey"
            columns: ["student_course_id"]
            isOneToOne: false
            referencedRelation: "student_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_courses: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          completed_at: string | null
          course_id: string
          hide_new_sessions: boolean
          id: string
          progress: number
          student_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          course_id: string
          hide_new_sessions?: boolean
          id?: string
          progress?: number
          student_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          course_id?: string
          hide_new_sessions?: boolean
          id?: string
          progress?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_courses_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_sessions: {
        Row: {
          completed: boolean
          completed_at: string | null
          earned_points: number | null
          id: string
          score: number | null
          session_id: string
          student_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          earned_points?: number | null
          id?: string
          score?: number | null
          session_id: string
          student_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          earned_points?: number | null
          id?: string
          score?: number | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_student_access_session: {
        Args: { session_id: string; student_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

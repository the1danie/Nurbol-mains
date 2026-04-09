export type Database = {
  public: {
    Tables: {
      teachers: {
        Row: {
          id: string
          full_name: string
          department: string | null
          position: string | null
          years_of_experience: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          department?: string | null
          position?: string | null
          years_of_experience?: number | null
        }
        Update: {
          full_name?: string
          department?: string | null
          position?: string | null
          years_of_experience?: number | null
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          teacher_id: string
          date: string
          subject: string
          lesson_type: string
          hours: number
          group_name: string | null
          room: string | null
          windows_count: number
          created_at: string
        }
        Insert: {
          teacher_id: string
          date: string
          subject: string
          lesson_type?: string
          hours?: number
          group_name?: string | null
          room?: string | null
          windows_count?: number
        }
        Update: {
          date?: string
          subject?: string
          lesson_type?: string
          hours?: number
          group_name?: string | null
          room?: string | null
          windows_count?: number
        }
      }
      health_records: {
        Row: {
          id: string
          teacher_id: string
          date: string
          blood_pressure_sys: number | null
          blood_pressure_dia: number | null
          heart_rate: number | null
          stress_level: number | null
          sleep_quality: number | null
          fatigue_level: number | null
          energy_level: number | null
          steps: number
          water_ml: number
          exercises_done: boolean
          exercise_minutes: number
          pain_head: boolean
          pain_back: boolean
          pain_neck: boolean
          pain_eyes: boolean
          pain_other: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          teacher_id: string
          date: string
          blood_pressure_sys?: number | null
          blood_pressure_dia?: number | null
          heart_rate?: number | null
          stress_level?: number | null
          sleep_quality?: number | null
          fatigue_level?: number | null
          energy_level?: number | null
          steps?: number
          water_ml?: number
          exercises_done?: boolean
          exercise_minutes?: number
          pain_head?: boolean
          pain_back?: boolean
          pain_neck?: boolean
          pain_eyes?: boolean
          pain_other?: string | null
          notes?: string | null
        }
        Update: Partial<{
          blood_pressure_sys: number | null
          blood_pressure_dia: number | null
          heart_rate: number | null
          stress_level: number | null
          sleep_quality: number | null
          fatigue_level: number | null
          energy_level: number | null
          steps: number
          water_ml: number
          exercises_done: boolean
          exercise_minutes: number
          pain_head: boolean
          pain_back: boolean
          pain_neck: boolean
          pain_eyes: boolean
          pain_other: string | null
          notes: string | null
        }>
      }
      daily_surveys: {
        Row: {
          id: string
          teacher_id: string
          date: string
          mood: number | null
          anxiety_level: number | null
          satisfaction_work: number | null
          lessons_count: number
          felt_overwhelmed: boolean
          had_conflicts: boolean
          extra_work_hours: number
          complaints: string | null
          created_at: string
        }
        Insert: {
          teacher_id: string
          date: string
          mood?: number | null
          anxiety_level?: number | null
          satisfaction_work?: number | null
          lessons_count?: number
          felt_overwhelmed?: boolean
          had_conflicts?: boolean
          extra_work_hours?: number
          complaints?: string | null
        }
        Update: Partial<{
          mood: number | null
          anxiety_level: number | null
          satisfaction_work: number | null
          lessons_count: number
          felt_overwhelmed: boolean
          had_conflicts: boolean
          extra_work_hours: number
          complaints: string | null
        }>
      }
    }
    Views: {
      daily_summary: {
        Row: {
          teacher_id: string
          date: string
          blood_pressure_sys: number | null
          blood_pressure_dia: number | null
          heart_rate: number | null
          stress_level: number | null
          sleep_quality: number | null
          fatigue_level: number | null
          energy_level: number | null
          steps: number | null
          water_ml: number | null
          mood: number | null
          anxiety_level: number | null
          satisfaction_work: number | null
          lessons_count: number | null
          felt_overwhelmed: boolean | null
          workload_index: number | null
          fatigue_index: number | null
          stress_index: number | null
          health_index: number | null
        }
      }
    }
  }
}

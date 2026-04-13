import type { FormState } from '../form/formState'

export const ENTRY_TABLE_NAME = 'entries'


export interface EntryRow {
  id: string
  country: string
  role_type: FormState['roleType']
  focus_area: FormState['focusArea']
  primary_constraint: FormState['primaryConstraint']
  organization_name: string
  organization_description: string
  estimated_reach: number
  contact: string | null
  created_at: string
}

export type EntryInsert = Omit<EntryRow, 'id' | 'created_at'>

export interface EntryDomainModel {
  id: string
  country: string
  roleType: FormState['roleType']
  focusArea: FormState['focusArea']
  primaryConstraint: FormState['primaryConstraint']
  organizationName: string
  organizationDescription: string
  estimatedReach: number
  contact: string
  createdAt: string
}

export interface AppDatabase {
  public: {
    Tables: {
      entries: {
        Row: EntryRow
        Insert: EntryInsert
        Update: Partial<EntryInsert>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

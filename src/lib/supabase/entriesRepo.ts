import type { FormState } from '../form/formState'
import { getSupabaseClient } from './client'
import type { EntryDomainModel, EntryInsert, EntryRow } from './types'
import { ENTRY_TABLE_NAME } from './types'

function parseEstimatedReach(value: string): number {
  const numericValue = Number(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
}

function toInsertPayload(formState: FormState): EntryInsert {
  return {
    country: formState.country,
    role_type: formState.roleType,
    focus_area: formState.focusArea,
    primary_constraint: formState.primaryConstraint,
    organization_name: formState.organizationName,
    estimated_reach: parseEstimatedReach(formState.estimatedYouthReach),
    contact: formState.contact.trim() ? formState.contact : null,
  }
}

function toDomainModel(row: EntryRow): EntryDomainModel {
  return {
    id: row.id,
    country: row.country,
    roleType: row.role_type,
    focusArea: row.focus_area,
    primaryConstraint: row.primary_constraint,
    organizationName: row.organization_name,
    estimatedReach: row.estimated_reach,
    contact: row.contact ?? '',
    createdAt: row.created_at,
  }
}

export async function insertEntry(formState: FormState): Promise<EntryDomainModel> {
  const supabase = getSupabaseClient()
  const payload = toInsertPayload(formState)
  const table = supabase.from(ENTRY_TABLE_NAME as never) as unknown as {
    insert: (values: EntryInsert) => {
      select: (columns: string) => {
        single: () => Promise<{ data: EntryRow; error: Error | null }>
      }
    }
  }

  const { data, error } = await table
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return toDomainModel(data)
}

export async function fetchEntries(): Promise<EntryDomainModel[]> {
  const supabase = getSupabaseClient()
  const table = supabase.from(ENTRY_TABLE_NAME as never) as unknown as {
    select: (columns: string) => {
      order: (column: string, options: { ascending: boolean }) => Promise<{ data: EntryRow[]; error: Error | null }>
    }
  }

  const { data, error } = await table
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data.map(toDomainModel)
}

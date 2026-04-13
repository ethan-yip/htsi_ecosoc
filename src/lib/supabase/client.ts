import { createClient } from '@supabase/supabase-js'
import type { AppDatabase } from './types'

let cachedClient: ReturnType<typeof createClient<AppDatabase>> | null = null

export function getSupabaseClient() {
  if (cachedClient) {
    return cachedClient
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  cachedClient = createClient<AppDatabase>(supabaseUrl, supabaseAnonKey)
  return cachedClient
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { frontendConfig } from '../config'

let supabaseClient: SupabaseClient | undefined

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const { supabaseUrl: url, supabaseAnonKey: anonKey } = frontendConfig

  if (!url || !anonKey) {
    throw new Error(
      'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local.',
    )
  }

  supabaseClient = createClient(url, anonKey)
  return supabaseClient
}

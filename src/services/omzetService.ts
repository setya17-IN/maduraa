import { getSupabaseClient } from '../lib/supabase'

export interface OmzetRecord {
  id: number
  created_at: string
  total: number
}

export type NewOmzetRecord = Pick<OmzetRecord, 'total'>

export const getOmzetList = async (): Promise<OmzetRecord[]> => {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .select('id, created_at, total')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error.message)
    throw error
  }

  return data
}

export const addOmzet = async (
  newRecord: NewOmzetRecord,
): Promise<OmzetRecord> => {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .insert(newRecord)
    .select('id, created_at, total')
    .single()

  if (error) {
    console.error('Error adding transaction:', error.message)
    throw error
  }

  return data
}
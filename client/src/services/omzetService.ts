import { getSupabaseClient } from '../lib/supabase'

// 1. Tentukan Interface / Tipe Data disesuaikan dengan tabel transactions
export interface OmzetRecord {
  id: string
  created_at: string
  total_amount: number
  payment_method: string | null
  user_id: string | null
}

export const getOmzetList = async (): Promise<OmzetRecord[]> => {
  const { data, error } = await getSupabaseClient()
    .from('transactions') // Diubah ke tabel resmi 'transactions'
    .select('id, user_id, total_amount, payment_method, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error.message);
    throw error;
  }

  return (data ?? []) as OmzetRecord[]
}

export type NewOmzetRecord = Pick<OmzetRecord, 'total_amount' | 'payment_method' | 'user_id'>

export const addOmzet = async (newRecord: NewOmzetRecord): Promise<OmzetRecord> => {
  const { data, error } = await getSupabaseClient()
    .from('transactions') // Diubah ke tabel resmi 'transactions'
    .insert(newRecord)
    .select('id, user_id, total_amount, payment_method, created_at')
    .single()

  if (error) {
    console.error('Error adding transaction:', error.message);
    throw error;
  }

  return data as OmzetRecord
}

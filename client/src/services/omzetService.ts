import { supabase } from '../lib/supabase';

// 1. Tentukan Interface / Tipe Data disesuaikan dengan tabel transactions
export interface OmzetRecord {
  id?: string;
  created_at?: string;
  total_amount: number;
  payment_method?: string;
  user_id?: string;
}

// 2. Helper untuk mengambil semua data transaksi
export const getOmzetList = async (): Promise<OmzetRecord[]> => {
  const { data, error } = await supabase
    .from('transactions') // Diubah ke tabel resmi 'transactions'
    .select('*')
    .order('created_at', { ascending: false }); // Diubah ke kolom 'created_at'

  if (error) {
    console.error('Error fetching transactions:', error.message);
    throw error;
  }

  return data || [];
};

// 3. Helper untuk menambah data transaksi baru
export const addOmzet = async (newRecord: OmzetRecord): Promise<OmzetRecord[]> => {
  const { data, error } = await supabase
    .from('transactions') // Diubah ke tabel resmi 'transactions'
    .insert([newRecord])
    .select();

  if (error) {
    console.error('Error adding transaction:', error.message);
    throw error;
  }

  return data || [];
};
import { supabase } from '../lib/supabase';

// 1. Tentukan Interface / Tipe Data
export interface OmzetRecord {
  id?: string;
  created_at?: string;
  tanggal: string;
  jumlah_omzet: number;
  keterangan?: string;
}

// 2. Helper untuk mengambil semua data omzet
export const getOmzetList = async (): Promise<OmzetRecord[]> => {
  const { data, error } = await supabase
    .from('omzet') // Sesuaikan nama tabel di Supabase Dashboard kamu jika berbeda
    .select('*')
    .order('tanggal', { ascending: false });

  if (error) {
    console.error('Error fetching omzet:', error.message);
    throw error;
  }

  return data || [];
};

// 3. Helper untuk menambah data omzet baru
export const addOmzet = async (newRecord: OmzetRecord): Promise<OmzetRecord[]> => {
  const { data, error } = await supabase
    .from('omzet')
    .insert([newRecord])
    .select();

  if (error) {
    console.error('Error adding omzet:', error.message);
    throw error;
  }

  return data || [];
};
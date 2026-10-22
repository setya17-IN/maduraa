const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;

export const frontendConfig = Object.freeze({
  supabaseUrl: VITE_SUPABASE_URL,
  supabaseAnonKey: VITE_SUPABASE_ANON_KEY,
});

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseClient = (dbName: string): SupabaseClient => {
  const supabaseUrlDinamico = process.env[`NEXT_PUBLIC_SUPABASE_URL_${dbName}`];
  const supabaseAnonKeyDinamico = process.env[`NEXT_PUBLIC_SUPABASE_ANON_KEY_${dbName}`];

  if (!supabaseUrlDinamico || !supabaseAnonKeyDinamico) {
    throw new Error(`No se encontraron configuraciones para la base de datos: ${dbName}`);
  }

  return createClient(supabaseUrlDinamico, supabaseAnonKeyDinamico);
};

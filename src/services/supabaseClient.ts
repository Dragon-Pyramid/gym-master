import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getGymConfig } from "@/config/gymOptions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseClient = (dbName: string): SupabaseClient => {
  const gym = getGymConfig(dbName);
  if (!gym) {
    throw new Error(`No se encontraron configuraciones para la base de datos: ${dbName}`);
  }
  return createClient(gym.url, gym.anonKey);
};

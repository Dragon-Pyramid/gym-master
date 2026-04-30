export type GymOption = {
  value: string;
  label: string;
  url: string;
  anonKey: string;
};

const normalizeDbName = (dbName: string): string => {
  return dbName.trim().toLowerCase().replaceAll("-", "_");
};

const gyms: GymOption[] = [
  {
    value: "gym_master",
    label: "Gym Master",
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL_gym_master ||
      process.env.SUPABASE_URL_gym_master ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      "",
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_gym_master ||
      process.env.SUPABASE_ANON_KEY_gym_master ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "",
  },
  //* Acá se agregarían nuevos gimnasios si fuese necesario.
];

export const gymOptions: GymOption[] = gyms.filter(
  (gym) => gym.url && gym.anonKey
);

export function getGymConfig(dbName: string): GymOption | undefined {
  const normalizedDbName = normalizeDbName(dbName);

  return gymOptions.find(
    (gym) => normalizeDbName(gym.value) === normalizedDbName
  );
}
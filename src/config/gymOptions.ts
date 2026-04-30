export type GymOption = {
  value: string;
  label: string;
  url: string;
  anonKey: string;
};

const gyms: GymOption[] = [
  {
    value: "gym_master",
    label: "Gym Master",
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL_gym_master ||
      process.env.SUPABASE_URL_gym_master ||
      "",
    anonKey:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_gym_master ||
      process.env.SUPABASE_ANON_KEY_gym_master ||
      "",
  },
  //* Aca se agregarian nuevos gyms si fuese necesario, o de forma dinamica (preferible que sea uno por uno)
];

export const gymOptions: GymOption[] = gyms.filter(
  (gym) => gym.url && gym.anonKey
);

export function getGymConfig(dbName: string): GymOption | undefined {
  return gymOptions.find((gym) => gym.value === dbName);
}

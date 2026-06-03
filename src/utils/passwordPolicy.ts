export type PasswordPolicyChecks = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
};

export function buildInitialPasswordFromDni(dni: string | number | null | undefined): string {
  const normalizedDni = String(dni ?? '').replace(/\D/g, '');
  return `GymMaster${normalizedDni}`;
}

export function getPasswordPolicyChecks(password: string | null | undefined): PasswordPolicyChecks {
  const value = String(password ?? '');

  return {
    minLength: value.length >= 8,
    uppercase: /[A-ZÁÉÍÓÚÑ]/.test(value),
    lowercase: /[a-záéíóúñ]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(value),
  };
}

export function isStrongPassword(password: string | null | undefined): boolean {
  return Object.values(getPasswordPolicyChecks(password)).every(Boolean);
}

export function getPasswordPolicyMessage(): string {
  return 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.';
}

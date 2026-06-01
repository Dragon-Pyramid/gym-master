export type PasswordPolicyCheckKey =
  | 'minLength'
  | 'lowercase'
  | 'uppercase'
  | 'number'
  | 'symbol';

export type PasswordPolicyChecks = Record<PasswordPolicyCheckKey, boolean>;

export type PasswordPolicyCheck = {
  key: PasswordPolicyCheckKey;
  label: string;
  valid: boolean;
};

export type PasswordPolicyResult = {
  isValid: boolean;
  valid: boolean;
  score: number;
  errors: string[];
  checks: PasswordPolicyCheck[];
  checksMap: PasswordPolicyChecks;
};

export const PASSWORD_POLICY = {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireNumber: true,
  requireSymbol: true,
};

export const PASSWORD_REQUIREMENTS = {
  minLength: 'Mínimo 8 caracteres',
  lowercase: 'Al menos una minúscula',
  uppercase: 'Al menos una mayúscula',
  number: 'Al menos un número',
  symbol: 'Al menos un símbolo',
};

export function normalizeDniForPassword(dni: string | number | null | undefined): string {
  return String(dni ?? '').replace(/\D/g, '').trim();
}

export function generateInitialPassword(dni: string | number | null | undefined): string {
  return `GymMaster${normalizeDniForPassword(dni)}`;
}

export function buildInitialPasswordFromDni(dni: string | number | null | undefined): string {
  return generateInitialPassword(dni);
}

export function buildInitialPassword(dni: string | number | null | undefined): string {
  return generateInitialPassword(dni);
}

export function getInitialPassword(dni: string | number | null | undefined): string {
  return generateInitialPassword(dni);
}

export function getTemporaryPasswordFromDni(dni: string | number | null | undefined): string {
  return generateInitialPassword(dni);
}

export function getPasswordPolicyChecks(password: string | null | undefined): PasswordPolicyChecks {
  const value = String(password ?? '');

  return {
    minLength: value.length >= PASSWORD_POLICY.minLength,
    lowercase: /[a-záéíóúñ]/.test(value),
    uppercase: /[A-ZÁÉÍÓÚÑ]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9]/.test(value),
  };
}

export function getPasswordPolicyCheckList(password: string | null | undefined): PasswordPolicyCheck[] {
  const checks = getPasswordPolicyChecks(password);

  return [
    {
      key: 'minLength',
      label: PASSWORD_REQUIREMENTS.minLength,
      valid: checks.minLength,
    },
    {
      key: 'lowercase',
      label: PASSWORD_REQUIREMENTS.lowercase,
      valid: checks.lowercase,
    },
    {
      key: 'uppercase',
      label: PASSWORD_REQUIREMENTS.uppercase,
      valid: checks.uppercase,
    },
    {
      key: 'number',
      label: PASSWORD_REQUIREMENTS.number,
      valid: checks.number,
    },
    {
      key: 'symbol',
      label: PASSWORD_REQUIREMENTS.symbol,
      valid: checks.symbol,
    },
  ];
}

export function validatePasswordPolicy(password: string | null | undefined): PasswordPolicyResult {
  const checksMap = getPasswordPolicyChecks(password);
  const checks = getPasswordPolicyCheckList(password);
  const errors = checks.filter((check) => !check.valid).map((check) => check.label);
  const score = checks.filter((check) => check.valid).length;
  const isValid = errors.length === 0;

  return {
    isValid,
    valid: isValid,
    score,
    errors,
    checks,
    checksMap,
  };
}

export function validatePasswordStrength(password: string | null | undefined): PasswordPolicyResult {
  return validatePasswordPolicy(password);
}

export function passwordMeetsPolicy(password: string | null | undefined): boolean {
  return validatePasswordPolicy(password).isValid;
}

export function isStrongPassword(password: string | null | undefined): boolean {
  return validatePasswordPolicy(password).isValid;
}

export function getPasswordPolicyErrors(password: string | null | undefined): string[] {
  return validatePasswordPolicy(password).errors;
}

export function getPasswordPolicyMessage(password?: string | null): string {
  if (password === undefined || password === null) {
    return 'La contraseña debe tener mínimo 8 caracteres, una minúscula, una mayúscula, un número y un símbolo.';
  }

  const errors = getPasswordPolicyErrors(password);

  if (errors.length === 0) {
    return 'La contraseña cumple con los requisitos de seguridad.';
  }

  return `La contraseña no cumple con los requisitos: ${errors.join(', ')}.`;
}

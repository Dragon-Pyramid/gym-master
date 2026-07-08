import type { I18nParams } from './translator';

type TranslateFn = (key: string, params?: I18nParams) => string;

const AUTH_ERROR_RULES: Array<{ key: string; patterns: string[] }> = [
  {
    key: 'auth.errors.emailRequired',
    patterns: ['el email es obligatorio', 'email es obligatorio', 'email field is required'],
  },
  {
    key: 'auth.errors.invalidUserType',
    patterns: ['tipo de usuario invalido', 'tipo de usuario inválido', 'invalid user type'],
  },
  {
    key: 'auth.errors.requestFailed',
    patterns: ['no se pudo procesar la solicitud', 'request could not be processed'],
  },
  {
    key: 'auth.errors.tokenRequired',
    patterns: ['token requerido', 'token required'],
  },
  {
    key: 'auth.errors.recoveryLinkMissing',
    patterns: ['el enlace de recuperación es obligatorio', 'recovery link is required'],
  },
  {
    key: 'auth.errors.recoveryLinkInvalid',
    patterns: ['el enlace no es válido o expiró', 'el enlace no es valido o expiro', 'link is invalid or expired'],
  },
  {
    key: 'auth.errors.recoveryLinkUsed',
    patterns: ['el enlace ya fue utilizado', 'link has already been used'],
  },
  {
    key: 'auth.errors.recoveryLinkExpired',
    patterns: ['el enlace expiró', 'el enlace expiro', 'link expired'],
  },
  {
    key: 'auth.errors.newPasswordRequired',
    patterns: ['la nueva contraseña es obligatoria', 'new password is required'],
  },
  {
    key: 'auth.errors.passwordUpdateFailed',
    patterns: ['no se pudo actualizar la contraseña', 'no se pudo restablecer la contraseña', 'password could not be updated'],
  },
  {
    key: 'auth.errors.passwordChangeFailed',
    patterns: ['error al cambiar contraseña', 'password change failed'],
  },
  {
    key: 'auth.errors.passwordPolicy',
    patterns: ['la contraseña debe cumplir', 'password must meet'],
  },
  {
    key: 'auth.errors.sessionExpired',
    patterns: ['sesión vencida', 'sesion vencida', 'session expired'],
  },
  {
    key: 'auth.errors.authentication',
    patterns: ['error de autenticación', 'error de autenticacion', 'authentication error', 'invalid login credentials'],
  },
  {
    key: 'auth.errors.connection',
    patterns: ['error de conexión', 'error de conexion', 'connection error', 'network error'],
  },
  {
    key: 'auth.success.passwordUpdated',
    patterns: ['contraseña actualizada correctamente', 'password updated successfully'],
  },
  {
    key: 'auth.recovery.requestProcessedToast',
    patterns: ['solicitud procesada correctamente', 'request processed successfully'],
  },
];

function normalizeMessage(message: string): string {
  return message
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function translateAuthMessage(
  message: unknown,
  t: TranslateFn,
  fallbackKey?: string,
): string {
  if (typeof message !== 'string' || !message.trim()) {
    return fallbackKey ? t(fallbackKey) : t('auth.errors.generic');
  }

  const normalized = normalizeMessage(message);
  const match = AUTH_ERROR_RULES.find((rule) =>
    rule.patterns.some((pattern) => normalized.includes(normalizeMessage(pattern))),
  );

  if (match) {
    return t(match.key);
  }

  return fallbackKey ? t(fallbackKey) : message;
}

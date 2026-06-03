export interface JwtUser {
  sub: string;
  id: string;
  id_socio?: string;
  email: string;
  rol: string;
  nombre?: string;
  foto?: string | null;
  permisos_menu?: string[] | null;
  must_change_password?: boolean;
  terminal_session?: boolean;
  terminal_issued_at?: string;
  exp?: number;
  iat?: number;
}

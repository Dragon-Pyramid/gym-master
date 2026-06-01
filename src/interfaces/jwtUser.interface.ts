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
  exp?: number;
  iat?: number;
}

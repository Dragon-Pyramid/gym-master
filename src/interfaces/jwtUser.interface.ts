export interface JwtUser {
  sub: string;
  id: string;
  email: string;
  rol: string;
  nombre: string;
  id_socio: string;
  foto: string | null;
}

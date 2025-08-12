export interface JwtUser{
    sub: string;
    id: string;
    email: string;
    rol: string;
    dbName: string;
    nombre: string;
    id_socio: string;
    foto: string | null; // Puede ser null si no hay foto
  }
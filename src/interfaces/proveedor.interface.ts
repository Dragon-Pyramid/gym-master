export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  direccion: string;
}

export interface CreateProveedorDto {
  nombre: string;
  contacto: string;
  telefono: string;
  direccion: string;
}

export interface UpdateProveedorDto {
  nombre?: string;
  contacto?: string;
  telefono?: string;
  direccion?: string;
}

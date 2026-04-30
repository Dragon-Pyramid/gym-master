import { CreateVentaDetalleDto, VentaDetalle } from "./venta_detalle.interface";

export interface Venta {
  id: string;
  socio_id: string;
  total: number;
  fecha: string;
  activo: boolean;
  id_venta_detalle: string;

  socio?: {
    nombre_completo: string;
  };


}

export interface CreateVentaDto {
  socio_id: string;
  fecha: string;
}

export interface CreateVentaConDetalleDto {
  venta: CreateVentaDto;
  venta_detalle: CreateVentaDetalleDto;
}

export interface UpdateVentaDto {
  socio_id?: string;
  total?: number;
  fecha?: string;
  activo?: boolean;
  id_venta_detalle?: string;
}


export interface ResponseVenta {
  id: string;
  //socio_id: string;
  total: number;
  fecha: string;
  venta_detalle: VentaDetalle;
  socio: {
    socio_id: string;
    nombre_completo: string;
  };

}

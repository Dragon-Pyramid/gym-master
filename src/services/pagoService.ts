import { getSupabaseClient, supabase } from "./supabaseClient";
import { Pago, CreatePagoDto, UpdatePagoDto, ResponsePago } from "../interfaces/pago.interface";
import  dayjs  from 'dayjs';
import { getSocioById, updateSocio } from "./socioService";

/*export const getAllPagos = async (): Promise<Pago[]> => {
  const { data, error } = await supabase.from("pago").select();
  if (error) throw new Error(error.message);
  return data as Pago[];
};
*/
export const getAllPagos = async () : Promise<ResponsePago[]> => {
    
  const { data, error } = await supabase
  .from("pago")
  .select(`*, 
    socio: socio_id ( id_socio, nombre_completo ),
    cuota: cuota_id (id, descripcion, fecha_fin),
    registrado_por: registrado_por( id, nombre )
    `);
    
console.log(error, data);

  if (error) throw new Error(error.message);

  const response = responseAllPagos(data as ResponsePago[]);
  return response;
};

//Genere esta funcion para transformar el formato de la respuesta y simplificar el uso en la funcion del get
const responseAllPagos = (data : ResponsePago[]) :  ResponsePago[] =>{
 const response : ResponsePago[] = data.map(pago=>(responsePago(pago)));
  return response;
}
const responsePago = (data: ResponsePago): ResponsePago => {
  return {
    id: data.id,
    fecha_pago: data.fecha_pago,
    fecha_vencimiento: data.fecha_vencimiento,
    monto_pagado: data.monto_pagado,
    total: data.total,
    enviar_email: data.enviar_email,
    registrado_por:{
        id: data.registrado_por.id,
        nombre: data.registrado_por.nombre
    },
    cuota:{
        id: data.cuota.id,
        descripcion: data.cuota.descripcion
    },
    socio:{
        id_socio: data.socio.id_socio,
        nombre_completo: data.socio.nombre_completo
    }
  };
}


export const createPago = async (payload: CreatePagoDto) :Promise<Pago> => {

    const { data :cuota , error:cuotaError } = await supabase
  .from("cuota")
  .select()
  .order('creado_en', { ascending: false })
  .limit(1)
  .single();

    if (cuotaError) {
    console.log(cuotaError.message);
    throw new Error("Error al traer la cuota")}
    ;
  
  const id_cuota = cuota.id
  const fecha_pago = dayjs().format("YYYY-MM-DD");
  const fecha_vencimiento = dayjs(fecha_pago).add(30, 'day').format("YYYY-MM-DD"); // fecha de vencimiento es hoy + 30 dias
  
  const { socio_id, registrado_por } = payload; 
  
  const dbName = "gym_master";
  const socio = await getSocioById(socio_id, dbName);
  let monto_pagado;

  if (socio.descuento_activo) {
monto_pagado = cuota.monto - (cuota.monto * 0.10); // Asignar el monto de la cuota al pago con descuento
  } else {
    monto_pagado = cuota.monto; // en caso que no tenga descuento, se le asigna el monto total de la cuota
  }



  const { data, error } = await supabase.from("pago").insert({
    socio_id,
    cuota_id: id_cuota,
    fecha_pago,
    fecha_vencimiento,
    monto_pagado,
    registrado_por,
    enviar_email: true, // Por defecto, se envía el email de notificación
    
  }).select().single();
  if (error) {
    console.log(error.message);
    throw new Error("Error al crear el pago")}
    ;

    //TODO: Debo crear la logica para pasarle el user logueado a todo los endpoint pagos
    //updateSocio(user, id_socio, { descuento_activo: false }); // Desactivar el descuento del socio después de realizar el pago

    const {data: dataSocio,error: errorSocio} = await supabase
    .from('socio')
    .update({ descuento_activo: false })
    .eq('id_socio', socio_id);
    if (errorSocio) {
        console.log(errorSocio.message);
        throw new Error("Error al actualizar el socio para desactivar el descuento");
    }
    if (dataSocio) {
        console.log("Descuento del socio desactivado correctamente");
        console.log("dataSocio", dataSocio);
        
    }

    
  return data as Pago;
};


export const updatePago = async (id: string, updateData: UpdatePagoDto): Promise<Pago> => {
  const { data, error } = await supabase.from("pago").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("No se encontró pago con ese id");
  return data as Pago;
};

export const deletePago = async (id: string): Promise<Pago> => {
  const { data, error } = await supabase.from("pago").update({ activo: false }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No se encontró pago con ese id");
  return data as Pago;
};

export const getPagoById = async (id: string): Promise<ResponsePago> => {
  const { data, error } = await supabase
    .from("pago")
      .select(`*, 
    socio: socio_id ( id_socio, nombre_completo ),
    cuota: cuota_id (id, descripcion, fecha_fin),
    registrado_por: registrado_por( id, nombre )
    `)
    .eq("id", id)
    .single();
  if (error) {
    console.log(error.message);
    throw new Error("No se encontró el pago con ese id");
  }
  const response = responsePago(data);
  return response;
};

// Funciones para métricas de pagos
export const dataAnalisisConductaPagos = async (user: any) => {
    const supabase = getSupabaseClient(user.dbName);
    const { data, error } = await supabase
        .rpc('sp_analisis_conducta_pagos');
    if (error) throw new Error(error.message);
    return data;
}

export const dataProyeccionIngresos = async (user: any) => {
    //TODO IMPLEMENTAR LÓGICA DE PROYECCIÓN DE INGRESOS
    throw new Error("Funcionalidad no implementada");
}

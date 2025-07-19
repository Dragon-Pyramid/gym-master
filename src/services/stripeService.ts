import { stripe } from "@/lib/stripe";
import { getSocioByIdUsuario } from "./socioService";
import { getSupabaseClient } from "./supabaseClient";

export const createSessionPago = async (user) : Promise<{ url: string }> => {
      const supabase = getSupabaseClient(user.dbName);
    
        //TRAIGO LA CUOTA MAS RECIENTE
        const { data: cuota, error: cuotaError } = await supabase
        .from("cuota")
        .select()
        .order('creado_en', { ascending: false })
        .limit(1)
        .single();
      
          if (cuotaError) {
          console.log(cuotaError.message);
          throw new Error("Error al traer la cuota");
        }
    
          const socio = await getSocioByIdUsuario(user.id);
    
          //VERIFICO SI EL SOCIO YA TIENE UN PAGO DE ESTA CUOTA
         const {data: ultimoPago,error:ultimoPagoError} = await supabase
         .from("pago")
         .select()
        .eq("socio_id", socio.id_socio)
        .order('fecha_pago', { ascending: false })
        .limit(1)
    
        if (ultimoPagoError) {
          console.log(ultimoPagoError.message);
          throw new Error("Error al traer el último pago");
        }
    
         // Verificar si hay pagos y si el último pago corresponde a la cuota actual
        if (ultimoPago && ultimoPago.length > 0 && ultimoPago[0].cuota_id === cuota.id) {
          throw new Error('Ya la cuota ya fue pagada');
        }
      
    
        //SI NO TIENE UN PAGO DE ESTA CUOTA, CREO LA SESION DE PAGO
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: cuota.descripcion,
            },
            unit_amount: cuota.monto * 100, // Convertir a centavos
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pago-fallido`,
        metadata: {
          socio_id: socio.id_socio,
          cuota_id: cuota.id,
        },
      } );

      if (!session || !session.url) {
        throw new Error("Error al crear la sesión de pago");
      }
    
      return { url: session.url };
}
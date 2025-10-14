import { sendEmail } from "@/lib/brevo";
import { supabase } from "./supabaseClient";
import  dayjs  from 'dayjs';
import { Socio } from "@/interfaces/socio.interface";
import { getAllSociosActivos } from "./socioService";

export async function obtenerSociosDeudores() : Promise<Socio[]> {
  const hoy = new Date().toISOString().slice(0, 10);

  // todos los socios activos
  const socios = await getAllSociosActivos(undefined as any);

  const sociosDeudores: Socio[] = [];

  for (const socio of socios) {
    // ultimo pago del socio
    const { data: ultimoPago, error: errorPago } = await supabase
      .from('pago')
      .select()
      .eq('socio_id', socio.id_socio)
      .order('fecha_vencimiento', { ascending: false })
      .limit(1)
      .single();

    if (errorPago || !ultimoPago) {
      console.log(`Socio ${socio.nombre_completo} (${socio.id_socio}) no tiene pagos registrados.`);
      continue;
    } /* SI ES UN SOCIO QUE AUN NO REALIZO PAGO, SE CONTINUA CON EL SIGUIENTE */



    // Verificar si el último pago está vencido
    if (dayjs(ultimoPago.fecha_vencimiento).isBefore(dayjs(hoy))) {
      // Solo envia email si enviar_email es true
      if (ultimoPago.enviar_email === true ) {   //LA IDEA ES Q MANDE TODOS LOS DIAS. HASTA QUE EL SOCIO PAGUE O LO SUSPENDAN
        console.log(`Socio ${socio.nombre_completo} (${socio.id_socio}) tiene un pago vencido.`);
        sociosDeudores.push(socio); /* SI SU ULTIMO PAGO SE VENCE, LO AÑADO AL ARRAY */

        // Enviar email de aviso de deuda
        if (socio.email) {
          const subject = "Aviso de cuota pendiente en Gym Master";
          const htmlContent = `<p>Hola ${socio.nombre_completo},</p>
            <p>Detectamos que tienes un pago vencido con fecha de vencimiento <b>${dayjs(ultimoPago.fecha_vencimiento).format('DD/MM/YYYY')}</b>.</p>
            <p>Por favor, regulariza tu situación para evitar la suspensión de tu membresía.</p>
            <p>Si ya realizaste el pago, por favor ignora este mensaje.</p>
            <br><p>Saludos,<br>Equipo Gym Master</p>`;

          try {
            await sendEmail({
              to: [{ email: socio.email, name: socio.nombre_completo }],
              subject,
              htmlContent,
            });
            console.log(`Email aviso de deuda enviado a ${socio.email}`);
          } catch (error) {
            console.error(`Error enviando email a ${socio.email}:`, error);
          }
        } else { //si el socio no tiene email registrado, se informa por consola
          console.log(`Socio ${socio.nombre_completo} no tiene email registrado.`);
        }
      }
    }
  }

  return sociosDeudores;
}


/**
 * Desactiva socios cuando el pago está vencido hace 7 días o más
 */
export const desactivarSociosPorDeuda = async () => {
  const hoy = new Date().toISOString().slice(0, 10);
  // Buscar todos los socios activos
  const socios = await getAllSociosActivos(undefined as any);

  const sociosDesactivados: Socio[] = [];
  for (const socio of socios) {
    // Buscar el último pago del socio
    const { data: ultimoPago, error: errorPago } = await supabase
      .from('pago')
      .select()
      .eq('socio_id', socio.id_socio)
      .order('fecha_vencimiento', { ascending: false })
      .limit(1)
      .single();

    if (errorPago || !ultimoPago) continue;


    // Si el pago está vencido hace 7 días o más
    const diasVencido = dayjs(hoy).diff(dayjs(ultimoPago.fecha_vencimiento), 'day');
    if (diasVencido >= 7 && socio.activo) {
      await supabase
        .from('socio')
        .update({ activo: false })
        .eq('id_socio', socio.id_socio)
        .single();
      sociosDesactivados.push(socio); // Agregar socio desactivado al array

      // Marcar que ya no se debe enviar más emails de deuda para este pago
      await supabase
        .from('pago')
        .update({ enviar_email: false })
        .eq('id', ultimoPago.id);
      console.log(`Socio ${socio.nombre_completo} (${socio.id_socio}) desactivado por deuda > 7 días.`);
      // Enviar email de notificación de desactivación
      if (socio.email) {
        const subject = "Membresía suspendida por falta de pago - Gym Master";
        const htmlContent = `<p>Hola ${socio.nombre_completo},</p>
          <p>Tu membresía ha sido suspendida debido a que tu pago está vencido hace más de 7 días.</p>
          <p>Por favor, regulariza tu situación para reactivar tu acceso.</p>
          <br><p>Saludos,<br>Equipo Gym Master</p>`;
        try {
          await sendEmail({
            to: [{ email: socio.email, name: socio.nombre_completo }],
            subject,
            htmlContent,
          });
          console.log(`Email de suspensión enviado a ${socio.email}`);
        } catch (error) {
          console.error(`Error enviando email de suspensión a ${socio.email}:`, error);
        }
      }
    }
  }
  return sociosDesactivados // Retorna los socios que fueron desactivados
};
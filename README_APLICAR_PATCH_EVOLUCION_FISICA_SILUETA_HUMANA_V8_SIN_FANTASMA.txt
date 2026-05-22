PATCH: EVOLUCION FISICA - SILUETA HUMANA V8 SIN FANTASMA

Objetivo:
- Eliminar el efecto fantasma producido por la superposicion visible de dos siluetas.
- Mantener el enfoque con referencias biometricas reales.
- Usar una sola silueta dominante por registro.

Cambios principales:
- Ya no renderiza dos imagenes completas superpuestas.
- Calcula un fitnessScore por registro.
- Elige una referencia dominante: soft o athletic.
- Mantiene escalado sutil por medidas.
- Mantiene sexo correcto: masculino/femenino.
- Evita fantasma, doble cabeza, doble brazo y doble contorno.
- No asume que el registro inicial sea sobrepeso.

Validacion:
- No debe verse fantasma atras.
- Debe quedar una sola silueta visible por tarjeta.
- Hombre debe usar referencias masculinas.
- Mujer debe usar referencias femeninas.
- Debe seguir existiendo diferencia visual entre Antes y Ahora.

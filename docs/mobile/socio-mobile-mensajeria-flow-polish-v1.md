# Socio mobile mensajería flow polish v1

## Objetivo

Pulir la experiencia mobile del socio en el flujo de mensajes con administración.

## Alcance

- Header mobile específico para contacto con administración.
- Métricas compactas de mensajes, pendientes y respondidos.
- Formulario mobile con asunto, categoría, mensaje, contadores y ayuda contextual.
- Historial en cards con estado, categoría, fecha, mensaje y respuesta administrativa.
- Estado vacío más claro.
- Mejor contraste claro/oscuro.
- Layout vertical `Header / Contenido / Footer` para evitar espacio blanco posterior al footer al salir de F12 mobile.

## Sin cambios

- No modifica base de datos.
- No modifica endpoints.
- No modifica Swagger/OpenAPI.
- No cambia el flujo admin de mensajes.

## Validación sugerida

1. Entrar como socio a `/dashboard/mensajes` en mobile.
2. Crear un mensaje con asunto, categoría y texto.
3. Ver el mensaje en el historial.
4. Verificar estados pendiente/respondido/cerrado si existen datos.
5. Validar modo claro y oscuro.
6. Salir de F12 mobile y confirmar que no queda espacio blanco después del footer.
7. Verificar que `/dashboard/mensajes-admin` no se ve afectado.

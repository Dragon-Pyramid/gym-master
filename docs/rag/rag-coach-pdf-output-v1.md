# RAG Coach PDF output v1

## Objetivo

Agregar una exportación PDF profesional y directa para cada respuesta útil generada por el Coach IA unificado de Gym Master.

La salida se genera en el navegador desde `/dashboard/coach` y no captura el layout del dashboard, sidebar, modo oscuro ni componentes visuales de la pantalla.

## Alcance funcional

Cada respuesta exitosa emitida después de una consulta muestra la acción:

```text
Descargar informe PDF / Download PDF report
```

El documento incluye, cuando existe:

- identidad visual y textos institucionales configurados para el gimnasio;
- socio asociado a la respuesta, con snapshot de nombre, DNI y email;
- fecha de emisión y usuario que generó el informe;
- consulta original y respuesta del Coach IA;
- intención y confianza contextual;
- resumen y snapshot operativo del socio;
- rutina generada y ejercicios organizados por día;
- dieta generada y comidas interpretadas desde observaciones;
- análisis de evolución con métricas, recomendaciones, alertas y disclaimers;
- acciones, fuentes RAG, similitud, QA y notas de seguridad;
- memoria, pistas, próximos pasos y sugerencias de continuidad;
- aviso responsable, texto legal y pie institucional;
- numeración `Página X de Y` / `Page X of Y`.

## Gobernanza ES/EN

El PDF utiliza el `locale` activo de la interfaz:

- `es`: títulos, etiquetas, fechas, días, comidas y aviso responsable en español;
- `en`: títulos, etiquetas, fechas, días, comidas y aviso responsable en inglés.

Los datos reales cargados por el gimnasio o el socio se mantienen sin traducción automática. Solo se traducen etiquetas y contenido propio del sistema, siguiendo la gobernanza previa de contenido generado por IA.

## Seguridad y propiedad

- El botón se encuentra dentro de `/dashboard/coach`, que ya exige una sesión autenticada.
- No se agrega un endpoint público de exportación.
- El PDF usa el snapshot del socio asociado al momento de generar la respuesta. Cambiar posteriormente el selector administrativo no altera el destinatario del informe anterior.
- No se vuelcan objetos internos completos ni JSON técnico crudo.
- Las imágenes del branding pasan por el proxy interno cuando son externas.
- El documento no contiene tokens, permisos, IDs internos ni trazas de autenticación.

## Archivos principales

```text
src/app/dashboard/coach/page.tsx
src/utils/ragCoachPdf.ts
scripts/verify-rag-coach-pdf-output.mjs
package.json
docs/rag/rag-coach-pdf-output-v1.md
```

## Alcance técnico excluido

No se modifican:

```text
src/app/api/rag/coach/chat/route.ts
src/services/server/ragCoachUnifiedChatService.ts
database/
supabase/migrations/
```

Tampoco se modifican contratos de API, tablas, migraciones, RLS, RPC ni persistencia del historial conversacional.

## Validación automática

```bash
npm run test:rag-coach-pdf
```

Gate acumulativo recomendado:

```bash
rm -rf .next

npm run build &&
npm run test:pwa-cache &&
npm run test:pwa-install-update &&
npm run test:auth-rbac &&
npm run test:http-runtime-security &&
npm run test:rag-coach-pdf &&
npm run test:business-backup-export &&
npm run test:repo-security
```

## QA manual

1. Ingresar como socio y solicitar orientación general; descargar el PDF.
2. Solicitar una rutina; verificar días, ejercicios, series, repeticiones, fuentes y QA.
3. Solicitar una dieta; verificar fechas, comidas, warnings y disclaimer.
4. Solicitar análisis de evolución; verificar métricas, recomendaciones y alertas.
5. Cambiar ES/EN y repetir una exportación.
6. Ingresar como administrador, seleccionar un socio y generar un informe.
7. Cambiar el selector de socio antes de descargar un informe anterior y comprobar que el PDF conserva el snapshot correcto.
8. Probar textos largos y verificar saltos de página, footer y ausencia de cortes.
9. Validar logo configurado y fallback `/gm_logo.svg`.
10. Confirmar que el botón no aparece en el saludo inicial ni en respuestas de error.

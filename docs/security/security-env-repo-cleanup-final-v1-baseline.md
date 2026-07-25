# Security Env & Repository Cleanup — Final Audit v1

## Objetivo

Cerrar la exposición accidental de secretos, credenciales de QA, metadatos locales y artefactos operativos antes de producción.

## Hallazgos iniciales

- El repositorio tenía metadatos locales de Supabase ya rastreados bajo `supabase/.temp` y `supabase/.branches`. Incluían referencia del proyecto enlazado, organización y URL del pooler, aunque no contenían contraseña.
- La documentación de QA conservaba una cuenta personal de prueba y ejemplos de contraseñas concretas.
- `.env.example` usaba valores con apariencia de secretos y no documentaba todas las variables consumidas mediante `process.env`.
- `.vercelignore` solo excluía una parte mínima del contexto local.
- No existía un gate acumulativo que impidiera volver a versionar estos artefactos.

## Correcciones

- `.env.example` pasa a ser el contrato completo de configuración y mantiene vacíos todos los secretos.
- Se eliminan del índice Git los metadatos regenerables de Supabase.
- Se anonimizan credenciales de QA presentes en documentación.
- Se amplían `.gitignore` y `.vercelignore` para llaves, certificados, credenciales cloud, datos E2E y carpetas operativas.
- Se agrega `npm run security:cleanup-local-artifacts` para retirar metadatos locales ya rastreados.
- Se agrega `npm run test:repo-security` como gate estático de rutas, secretos, contrato de entorno y exclusiones de deploy.

## Alcance del gate

El verificador falla ante:

- `.env` reales, SQL, dumps, backups, llaves privadas o archivos de credenciales rastreados;
- `supabase/.temp`, `supabase/.branches` y carpetas DB privadas rastreadas;
- patrones reconocibles de tokens de proveedores, JWT, private keys y URLs con credenciales;
- cuentas personales de Gmail/Hotmail/Outlook/Yahoo dentro de documentación;
- variables usadas por el código que no estén declaradas en `.env.example`;
- valores cargados en ejemplos de secretos;
- variables secretas con prefijo `NEXT_PUBLIC_`;
- exclusiones críticas ausentes en `.vercelignore`.

## Límites

- Este gate analiza el árbol actual del repositorio; no reescribe el historial remoto de Git.
- Si alguna credencial real estuvo versionada anteriormente, debe revocarse/rotarse y evaluarse una limpieza de historial con coordinación del equipo.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública por diseño, pero permanece vacía en el ejemplo para evitar asociar el repositorio con un proyecto concreto.
- La auditoría no modifica DB, migraciones, RLS, RPC ni datos productivos.

## Validación

```bash
npm run security:cleanup-local-artifacts
npm run test:repo-security
npm run build
npm run test:auth-rbac
```

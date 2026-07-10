# i18n navigation menus final sweep v32 - Attendance terminal labels fix

## Objetivo

Corregir textos en español/híbridos cuando la pantalla `/dashboard/asistencias/terminal` se visualiza con idioma inglés.

## Archivo actualizado

- `src/components/asistencia/AsistenciaTerminalDisplay.tsx`

## Ajustes puntuales

Se agrega `useI18n()` directamente al componente de Terminal de asistencia y se controlan los textos visibles sin tocar lógica de QR, sesión, polling ni registro:

- `Terminal de asistencia` → `Attendance terminal`
- `Terminal listo` → `Terminal ready`
- `Escaneá el QR para registrar asistencia` → `Scan the QR to register attendance`
- `Abrí la cámara de tu celular...` → `Open your phone camera...`
- `Ingreso con celular` → `Mobile check-in`
- `Escaneá este QR` → `Scan this QR`
- pasos de uso del QR
- `Monitor externo` → `External monitor`
- `Actividad reciente` → `Recent activity`
- `Salida` / `Ingreso` → `Exit` / `Check-in`
- `Deuda` → `Debt`
- `Bloqueado` → `Blocked`
- `Esta pantalla está pensada...` → English explanatory note
- mensajes de sesión/renovación visibles
- mensajes de estado/eventos visibles

## Alcance

- Solo frontend/i18n.
- Sin cambios en DB.
- Sin cambios en endpoints.
- Sin cambios en Swagger/OpenAPI.
- Sin cambios en servicios QR.
- Sin cambios en polling/realtime.
- Sin cambios en autenticación o sesión terminal.
- Sin cambios en PDF/Excel.

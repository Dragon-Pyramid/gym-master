# Gym Master — `i18n_es_en_admin_dashboard_final_sweep_v1` — `rutinas_media_fix_v2`

## Scope
- Route: `/dashboard/rutinas/media`
- Keeps the i18n and dark-mode changes from v1.
- Improves the KPI cards by using available space more effectively.
- Adds mnemonic icons related to each metric:
  - Total exercises → dumbbell
  - In Cloudinary → cloud
  - Pending Cloudinary → image/media icon
  - Pending YouTube → video icon
  - With fallback → alert/fallback icon
- Also adds small support icons in the readiness mini-cards.

## Safety
- No DB changes.
- No endpoint changes.
- No Swagger/OpenAPI changes.
- No Cloudinary/YouTube business logic changes.

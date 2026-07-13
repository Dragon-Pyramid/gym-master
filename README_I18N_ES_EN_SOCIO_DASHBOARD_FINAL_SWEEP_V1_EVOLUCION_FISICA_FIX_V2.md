# I18N ES/EN Socio Dashboard Final Sweep V1 - Evolución Física Fix V2

## Alcance

Corrección runtime posterior al fix v1 en `/dashboard/evolucion-fisica`.

## Problema corregido

El archivo `src/app/dashboard/evolucion-fisica/page.tsx` usaba `tx(...)` en el render y en callbacks, pero el helper no estaba definido dentro del componente. Esto provocaba:

```txt
ReferenceError: tx is not defined
```

## Cambios

- Importa `useI18n` desde `@/i18n/I18nProvider`.
- Define `locale`, `isEnglish` y `tx` dentro de `EvolucionFisicaPage`.
- Usa `useCallback` para que `tx` pueda quedar correctamente referenciado en dependencias de `useMemo`/callbacks.

## No modifica

- DB.
- Endpoints.
- Swagger/OpenAPI.
- Lógica de registro de evolución.
- PDF/Excel.
- RAG.
- Silueta, heatmap, coordenadas, animaciones, transforms ni componentes visuales sensibles.

## Validación sugerida

```bash
rm -rf .next
npm run build
```

Luego limpiar PWA si corresponde:

```bash
git checkout -- public/sw.js
rm -f public/fallback-*.js
```

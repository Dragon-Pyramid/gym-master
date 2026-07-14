# Fix exportables actividades - locale scope v1

Corrige un error de build en `src/app/dashboard/actividades/page.tsx` causado por el patch de exportables:

```txt
Type error: Cannot find name 'locale'.
```

La causa era que `sanitizeActivity`, función declarada fuera del componente, quedó usando `translateActivityText(locale, ...)` aunque `locale` solo existe dentro de `ActividadesPage`.

Este fix devuelve `sanitizeActivity` a un mapper neutro de datos. Los labels de PDF/Excel siguen usando `locale` dentro del componente, donde corresponde.

No toca DB, endpoints, Swagger/OpenAPI ni lógica de turnos/cupos/inscripciones.

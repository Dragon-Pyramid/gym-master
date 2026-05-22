# Evolución física - PDF biométrico

## Resumen

Esta feature agrega al PDF de evolución física una sección final de visualización biométrica basada en los registros reales del socio.

## Alcance

- Se mantiene el logo real que ya usa el PDF.
- Se agregan siluetas biométricas masculinas o femeninas según `sexo_referencia`.
- Se reutilizan los assets existentes en `public/images/evolucion-fisica/siluetas`.
- Se mantiene la tabla de mediciones segmentarias.
- Se mantienen los gráficos capturados desde dashboard.
- Se mejoran visualmente las tarjetas superiores del resumen.

## Sección nueva

La nueva sección se agrega al final del PDF:

- **Visualización biométrica**
  - Antes / Registro inicial
  - Ahora / Última medición
  - Lectura automática / Cambios corporales detectados

## Datos usados

La sección biométrica usa:

- peso
- cintura
- porcentaje de grasa
- masa muscular
- bíceps izquierdo/derecho
- muslo izquierdo/derecho
- pantorrilla izquierda/derecha
- cadera
- sexo de referencia

## Decisión visual

El sistema calcula un estado visual por registro. No asume que todo socio inicia con sobrepeso. La referencia soft o athletic se selecciona según composición corporal, grasa, cintura, masa muscular y medidas segmentarias.

## Restricciones

- No modifica base de datos.
- No modifica APIs.
- No agrega dependencias.
- No cambia el flujo de descarga del PDF.

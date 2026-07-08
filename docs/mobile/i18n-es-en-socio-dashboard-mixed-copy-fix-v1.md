# i18n ES/EN socio dashboard mixed copy fix v1

## Objetivo
Corregir textos visibles que todavía quedaban en español dentro del dashboard mobile del socio cuando la app estaba en inglés.

## Ajustes realizados
- Mensajería/soporte: se tradujeron descripción, badge de rol y CTA de bandeja.
- Rutina del día: se localiza la etiqueta del día de la semana y se normalizan títulos automáticos de rutina como "Rutina auto" hacia inglés.
- Pagos/recibos: se normaliza la descripción de cuota cuando proviene en español desde datos y se muestra como "Monthly fee" en inglés.
- Actividades: se normalizan algunos nombres comunes con sufijos de nivel (por ejemplo, "Yoga inicial" -> "Beginner Yoga") cuando el idioma activo es inglés.

## Nota
Este fix reduce la mezcla ES/EN en contenido estructurado y demo data visible. Los contenidos completamente libres cargados por administración siguen dependiendo del texto guardado en base de datos. Para un soporte multilenguaje completo de contenido editable, más adelante conviene evaluar un modelo con campos bilingües o estrategia de traducción asistida.

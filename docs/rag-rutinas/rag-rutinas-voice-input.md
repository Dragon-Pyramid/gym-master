# RAG Rutinas — Entrada por voz

## Objetivo

Mejorar la experiencia del asistente de rutinas para que el socio pueda dictar texto desde el celular, revisar la transcripción y generar una rutina sin depender de escribir demasiado.

La voz se usa como una comodidad de entrada. El asistente sigue trabajando con texto editable y con el contrato estructurado existente para generar la rutina.

## Alcance implementado

Se agrega en `/dashboard/rutinas/asistente` un botón de micrófono junto al campo **Qué querés lograr o priorizar**.

El flujo esperado es:

```txt
Socio toca “Dictar con voz”
→ el navegador solicita permiso de micrófono
→ el socio habla
→ puede hacer pausas breves
→ el texto aparece en el textarea
→ el socio puede detener el dictado
→ el socio puede revisar/corregir
→ envía el formulario para generar rutina
```

## Mejora de dictado continuo

La primera versión del dictado cortaba la captura al detectar pausas breves. Esta mejora usa una experiencia de dictado más continua:

```txt
continuous = true
interimResults = true
botón explícito iniciar/detener
reintento automático si el navegador finaliza la escucha mientras el usuario sigue en modo dictado
acumulación de texto sin pisar lo ya escrito
```

El comportamiento puede variar según navegador/dispositivo, pero se mejora la experiencia en Chrome/Chromium y Android.

## Extracción básica de intención

Además de transcribir texto, el asistente intenta detectar parámetros escritos o dictados y sincronizarlos con el formulario actual.

Ejemplos:

```txt
“Quiero aumentar masa muscular 6 días”
→ objetivo: Volumen
→ días: 6
```

```txt
“Soy principiante y quiero bajar grasa”
→ objetivo: Bajar de peso
→ nivel: Inicial
```

```txt
“Tengo lumbalgia”
→ agrega restricción lumbar conservadora
```

Esta extracción no reemplaza al futuro RAG conversacional completo. Es una mejora defensiva para que el fallback local no ignore datos importantes expresados por voz.

## Decisión de UX

El dictado no envía automáticamente el mensaje al asistente.

Primero se transcribe al campo editable para que el socio pueda:

- revisar el texto;
- corregir errores de transcripción;
- agregar detalles manualmente;
- confirmar que los parámetros detectados son correctos;
- decidir cuándo generar la rutina.

Esto evita generar rutinas a partir de una transcripción incompleta o incorrecta.

## Seguridad y restricciones

Si el socio menciona restricciones como lumbalgia, dolor lumbar o lesión, el sistema las registra en el campo de restricciones para que la generación pueda ser más conservadora.

La futura versión RAG deberá profundizar este comportamiento:

- evitar ejercicios de alto riesgo lumbar;
- priorizar variantes controladas;
- recomendar supervisión profesional si hay dolor activo;
- no reemplazar diagnóstico médico o kinesiológico.

## Límites conocidos

El soporte de reconocimiento de voz depende del navegador.

En navegadores sin soporte, no se rompe el asistente: el formulario sigue funcionando por texto manual.

La extracción actual de intención es básica y basada en reglas. El objetivo futuro es que el microservicio `gym-master-rag-coach` infiera parámetros desde conversación natural, pida confirmación y devuelva JSON validado.

## Evolución futura

Próximas mejoras recomendadas:

```txt
feature/rag-rutinas-conversational-flow
feature/rag-rutinas-voice-to-rag-transcription
```

La etapa avanzada podría enviar audio al futuro microservicio `gym-master-rag-coach` para transcripción server-side, con mayor control de calidad, auditoría, permisos y privacidad.

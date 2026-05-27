# RAG Rutinas — JSON Schema funcional

## Objetivo

Definir una estructura JSON estándar para que las salidas del futuro `gym-master-rag-coach` puedan ser validadas y transformadas en rutinas reales dentro de Gym Master.

Este documento es una especificación funcional. En una etapa posterior se puede convertir a JSON Schema estricto, Zod o TypeScript types.

## Reglas generales

- El JSON debe ser válido.
- No debe depender de texto libre para guardar una rutina.
- Debe identificar objetivo, nivel, días, idioma y criterio de generación.
- Debe permitir mapear ejercicios contra la base real de Gym Master.
- Debe incluir razonamiento resumido, no cadena de pensamiento.
- Debe incluir advertencias de seguridad cuando corresponda.
- Debe generar contenido en español y dejar campos preparados para inglés.

## Estructura general

```json
{
  "version_schema": "1.0.0",
  "idioma": "es",
  "tipo_salida": "rutina_dieta",
  "perfil_socio": {
    "sexo": "masculino",
    "edad": 49,
    "peso_kg": 95,
    "altura_cm": 176,
    "nivel": "intermedio",
    "objetivo": "volumen",
    "dias_por_semana": 6,
    "lesiones": [],
    "restricciones": [],
    "experiencia": "entrena en gimnasio"
  },
  "rutina": {
    "nombre": "Rutina de volumen 6 días - intermedio",
    "objetivo": "volumen",
    "nivel": "intermedio",
    "dias_por_semana": 6,
    "duracion_estimada_minutos": 90,
    "frecuencia_muscular": 2,
    "criterio_general": "Hipertrofia con frecuencia 2, énfasis en ejercicios compuestos al inicio y accesorios al final.",
    "dias": [
      {
        "dia_numero": 1,
        "nombre_dia": "Pecho + Tríceps",
        "grupos_musculares": ["Pecho", "Tríceps"],
        "enfoque": "empuje horizontal e hipertrofia de tríceps",
        "ejercicios": [
          {
            "orden": 1,
            "id_ejercicio": null,
            "nombre_ejercicio": "Press de banca plano",
            "nombre_en": "Flat barbell bench press",
            "grupo_muscular": "Pecho",
            "tipo_ejercicio": "compuesto",
            "patron_movimiento": "empuje_horizontal",
            "equipamiento": "barra_banco",
            "series": 4,
            "repeticiones": "6-8",
            "descanso_segundos": 150,
            "rpe": 8,
            "intensidad": "media-alta",
            "tempo": "2-0-1",
            "motivo_orden": "Ejercicio principal, requiere mayor energía y técnica.",
            "alternativas": ["Press en máquina", "Press con mancuernas"],
            "media": {
              "imagen_url": null,
              "gif_url": null,
              "video_youtube_url": null,
              "youtube_video_id": null
            }
          }
        ]
      }
    ],
    "progresion": {
      "criterio": "Cuando completa el rango alto de repeticiones con técnica correcta, aumentar carga gradualmente.",
      "deload": "Reducir volumen 20-30% cada 6-8 semanas o si hay fatiga acumulada."
    },
    "advertencias": [
      "Suspender si aparece dolor agudo, mareos o malestar persistente."
    ]
  },
  "dieta": {
    "objetivo_nutricional": "superavit_controlado",
    "calorias_estimadas": 3000,
    "proteina_g": "180-200",
    "carbohidratos_g": "330-380",
    "grasas_g": "75-90",
    "criterio_ajuste": "Mantener 14 días y ajustar según peso, cintura y rendimiento.",
    "comidas": [
      {
        "nombre": "Desayuno",
        "alimentos": ["avena", "leche", "banana", "huevos", "yogur"],
        "objetivo_kcal": "700-800"
      }
    ],
    "reemplazos": {
      "proteinas": ["pollo", "carne magra", "pescado", "huevos", "yogur griego"],
      "carbohidratos": ["arroz", "papa", "batata", "avena", "pasta", "frutas"],
      "grasas": ["aceite de oliva", "frutos secos", "palta", "yema de huevo"]
    },
    "advertencias": [
      "No reemplaza indicación médica o nutricional personalizada."
    ]
  },
  "validacion": {
    "no_repetir_rutina_anterior": true,
    "requiere_revision_humana": false,
    "ejercicios_deben_existir_en_db": true,
    "usar_media_disponible": true
  },
  "mensaje_final_socio": "Tu rutina fue generada en base a lo que me pediste. Dirigite al menú Rutinas y allí la encontrarás."
}
```

## Campos obligatorios futuros

Para guardar una rutina real en Gym Master, como mínimo se debería exigir:

```txt
idioma
perfil_socio.objetivo
perfil_socio.nivel
perfil_socio.dias_por_semana
rutina.nombre
rutina.dias[].dia_numero
rutina.dias[].ejercicios[].orden
rutina.dias[].ejercicios[].nombre_ejercicio
rutina.dias[].ejercicios[].series
rutina.dias[].ejercicios[].repeticiones
rutina.dias[].ejercicios[].descanso_segundos
```

## Campos recomendados

```txt
id_ejercicio
nombre_en
grupo_muscular
tipo_ejercicio
patron_movimiento
equipamiento
rpe
intensidad
motivo_orden
media.video_youtube_url
media.imagen_url
```

## Adaptación futura a TypeScript

En una etapa posterior, este documento puede convertirse a:

```txt
src/interfaces/ragRutinas.interface.ts
src/lib/rag-rutinas/rutinaSchema.ts
src/lib/rag-rutinas/validateRutinaOutput.ts
```

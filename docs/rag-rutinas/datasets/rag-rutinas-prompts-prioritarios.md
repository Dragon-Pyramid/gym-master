# RAG Rutinas — Prompts prioritarios

Este archivo lista la matriz prioritaria para generar corpus inicial. Cada bloque se usa junto con `prompt-maestro-rutina-dieta-json.md` reemplazando variables.

Total de combinaciones prioritarias: 180

## Uso

1. Copiar el prompt maestro.
2. Tomar un bloque de parámetros de este archivo.
3. Reemplazar variables.
4. Generar rutina + dieta + JSON.
5. Revisar y curar antes de cargar al RAG.

## Bloques de parámetros

### RAG-VOL-INI-3D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-3D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-3D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-4D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-4D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-4D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-5D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-5D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-5D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-6D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-6D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INI-6D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-3D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-3D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-3D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-4D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-4D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-4D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-5D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-5D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-5D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-6D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-6D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-INT-6D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-3D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-3D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-3D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-4D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-4D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-4D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-5D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-5D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-5D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-6D-LIVIANO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-6D-MEDIO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-VOL-AVA-6D-ALTO

```txt
{{OBJETIVO}} = Volumen
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-3D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-3D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-3D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-4D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-4D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-4D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-5D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-5D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-5D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-6D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-6D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INI-6D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-3D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-3D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-3D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-4D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-4D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-4D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-5D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-5D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-5D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-6D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-6D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-INT-6D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-3D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-3D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-3D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-4D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-4D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-4D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-5D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-5D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-5D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-6D-LIVIANO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-6D-MEDIO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-DEF-AVA-6D-ALTO

```txt
{{OBJETIVO}} = Definición
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-3D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-3D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-3D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-4D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-4D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-4D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-5D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-5D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-5D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-6D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-6D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INI-6D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-3D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-3D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-3D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-4D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-4D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-4D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-5D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-5D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-5D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-6D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-6D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-INT-6D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-3D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-3D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-3D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-4D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-4D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-4D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-5D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-5D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-5D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-6D-LIVIANO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-6D-MEDIO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-BPE-AVA-6D-ALTO

```txt
{{OBJETIVO}} = Bajar de peso
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-3D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-3D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-3D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-4D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-4D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-4D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-5D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-5D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-5D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-6D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-6D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INI-6D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-3D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-3D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-3D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-4D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-4D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-4D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-5D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-5D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-5D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-6D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-6D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-INT-6D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-3D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-3D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-3D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-4D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-4D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-4D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-5D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-5D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-5D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-6D-LIVIANO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-6D-MEDIO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-FUE-AVA-6D-ALTO

```txt
{{OBJETIVO}} = Aumentar fuerza
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-3D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-3D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-3D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-4D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-4D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-4D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-5D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-5D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-5D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-6D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-6D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INI-6D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Inicial
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-3D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-3D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-3D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-4D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-4D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-4D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-5D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-5D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-5D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-6D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-6D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-INT-6D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Intermedio
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-3D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-3D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-3D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 3
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-4D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-4D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-4D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 4
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-5D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-5D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-5D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 5
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-6D-LIVIANO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = liviano
{{PESO_KG}} = 60
{{ALTURA_CM}} = 165
{{EDAD}} = 35
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-6D-MEDIO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = medio
{{PESO_KG}} = 78
{{ALTURA_CM}} = 172
{{EDAD}} = 40
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

### RAG-RES-AVA-6D-ALTO

```txt
{{OBJETIVO}} = Mejorar resistencia
{{NIVEL}} = Avanzado
{{DIAS}} = 6
{{RANGO_PESO}} = alto
{{PESO_KG}} = 95
{{ALTURA_CM}} = 176
{{EDAD}} = 49
{{SEXO}} = masculino/femenino
{{LESIONES}} = sin lesiones reportadas
{{EQUIPAMIENTO}} = gimnasio completo: máquinas, poleas, barras, mancuernas, banco, cardio
{{IDIOMA}} = español
```

# Integración del Backend de Datos - Gym Master

## 📋 Descripción

Esta implementación proporciona la integración completa del backend de datos para el sistema Gym Master, incluyendo:

- ✅ Configuración de Supabase para la gestión de datos
- ✅ Servicios para gestión de socios, rutinas personalizadas y asistencia
- ✅ Integración preparada para el módulo de IA
- ✅ Estructura de base de datos optimizada
- ✅ Tipos TypeScript para tipado fuerte

## 🛠️ Estructura Implementada

```bash
gym-master/
├── services/                 # Servicios del backend de datos
│   ├── socios.service.ts    # Gestión de socios
│   ├── ia.service.ts        # Integración con IA
│   ├── asistencia.service.ts # Registro de asistencia
│   └── index.ts             # Exportaciones centralizadas
├── lib/
│   └── supabase.ts          # Configuración de Supabase
├── types/
│   └── index.ts             # Tipos TypeScript
├── database/
│   └── schema.sql           # Script de creación de tablas
├── .env.example             # Variables de entorno
├── package.json             # Dependencias del proyecto
└── next.config.js           # Configuración de Next.js
```

## 🚀 Configuración

### 1. Variables de Entorno

Copiar `.env.example` a `.env.local` y configurar las variables:

```bash
cp .env.example .env.local
```

### 2. Base de Datos

Ejecutar el script SQL en Supabase:

```sql
-- Ejecutar database/schema.sql en Supabase SQL Editor
```

### 3. Instalación de Dependencias

```bash
npm install
```

## 📚 Servicios Disponibles

### SociosService

Gestión completa de socios del gimnasio:

```typescript
import { SociosService } from './services'

// Obtener socios activos
const socios = await SociosService.obtenerSociosActivos()

// Crear nuevo socio
const nuevoSocio = await SociosService.crearSocio(datosDelSocio)

// Obtener socios con cuota vencida
const sociosVencidos = await SociosService.obtenerSociosConCuotaVencida()
```

### IAService

Integración con el módulo de Inteligencia Artificial:

```typescript
import { IAService } from './services'

// Generar rutina personalizada
const rutina = await IAService.generarRutinaPersonalizada(socioId)

// Generar dieta personalizada
const dieta = await IAService.generarDietaPersonalizada(socioId)

// Obtener rutinas del socio
const rutinas = await IAService.obtenerRutinasSocio(socioId)
```

### AsistenciaService

Control de asistencia y presencia:

```typescript
import { AsistenciaService } from './services'

// Registrar entrada
const entrada = await AsistenciaService.registrarEntrada(socioId)

// Registrar salida
const salida = await AsistenciaService.registrarSalida(registroId, rutinaRealizada)

// Obtener estadísticas
const stats = await AsistenciaService.obtenerEstadisticasAsistencia(fechaInicio, fechaFin)
```

## 🔐 Seguridad

- ✅ Row Level Security (RLS) habilitado en todas las tablas
- ✅ Políticas básicas de acceso configuradas
- ✅ Validaciones de tipos con TypeScript
- ✅ Variables de entorno para configuración sensible

## 🤖 Integración con IA

El sistema está preparado para integrar con el módulo de Python de IA:

- Estructura de datos compatible con algoritmos de ML
- Parámetros de personalización definidos
- Endpoints preparados para comunicación con backend de Python
- Almacenamiento de resultados de IA en la base de datos

### TODO: Integración Python

```python
# Ejemplo de integración futura con Python
def generar_rutina_personalizada(parametros):
    # Procesar con TensorFlow/Scikit-learn
    return rutina_generada
```

## 📊 Modelos de Datos

### Socio
- Información personal completa
- Nivel de experiencia y objetivos
- Historial de cuotas y estado
- Datos para personalización de IA

### Rutina Personalizada
- Ejercicios con series y repeticiones
- Nivel de dificultad adaptativo
- Generación automática por IA
- Seguimiento de progreso

### Dieta Personalizada
- Cálculo de macronutrientes
- Comidas e ingredientes detallados
- Adaptación a objetivos personales
- Restricciones alimentarias

### Registro de Asistencia
- Control de entrada y salida
- Seguimiento de rutinas realizadas
- Estadísticas de uso del gimnasio

## 🔧 Próximos Pasos

1. **Implementar integración real con módulo Python de IA**
2. **Configurar autenticación con NextAuth**
3. **Añadir validaciones adicionales de datos**
4. **Implementar cache para mejor rendimiento**
5. **Agregar logging y monitoreo**
6. **Configurar notificaciones por email**

## 🚨 Notas Importantes

- Las políticas de RLS deben ajustarse según el sistema de autenticación final
- El módulo de IA actualmente usa datos simulados hasta implementar la integración Python
- Las variables de entorno deben configurarse antes del primer uso
- Se recomienda configurar backup automático de la base de datos

---

**Desarrollado por Dragon Pyramid** 🐉  
**Proyecto Gym Master - Sistema de Gestión Integral**
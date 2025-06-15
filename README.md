# 🏋️‍♂️ Gym Master

**Gym Master** es un sistema integral de gestión de gimnasios desarrollado por **Dragon Pyramid**. Está diseñado para automatizar tareas administrativas, mejorar la experiencia del cliente y ofrecer herramientas inteligentes para rutinas personalizadas.  
Este sistema es desarrollado por un equipo de pasantes en un proyecto acelerado de 3 meses.

---

## 🚀 Objetivo del Proyecto

Crear una plataforma moderna, segura y eficiente para la gestión completa de un gimnasio, incluyendo usuarios, socios, asistencia, pagos, rutinas, productos, ventas y dietas personalizadas, con soporte para funcionalidades híbridas.

---

## 🧠 Stack Tecnológico

- **Next.js 14** (App Router + API Routes)
- **TailwindCSS** (estilos rápidos y modernos)
- **Shadcn UI** (componentes UI basados en Radix UI + TailwindCSS)
- **Supabase** (Base de datos PostgreSQL + Autenticación + Storage)
- **TypeScript** (tipado fuerte)
- **PWA Ready** (instalable en móviles, tablets y desktops)
- **NextAuth** (autenticación con Google)
- **Stripe** (pagos online)
- **IndexedDB** (almacenamiento local para modo offline)
- **Jest** (testing en futuras versiones)
- **Python** + **Scikit-Learn / TensorFlow / Pandas** (para el módulo IA)

---

## 🤖 IA aplicada a Fitness y Nutrición

Contamos con un **módulo de Inteligencia Artificial** desarrollado por el área de **Data Science**. Su función es:

- Generar **rutinas personalizadas** a partir de parámetros como edad, género, IMC, historial de entrenamiento, nivel de experiencia y objetivos.
- Recomendar **dietas específicas** según las metas del usuario, condiciones médicas y horarios.
- Aprendizaje continuo de los hábitos del usuario.
- Ajuste dinámico de las recomendaciones basado en la evolución del cliente.
- Evaluaciones automáticas mensuales.

**Tecnologías utilizadas en IA**:
- Lenguaje: Python
- Librerías: Pandas, NumPy, Scikit-Learn, TensorFlow
- Entrenamiento de modelos supervisados y sistemas de recomendación.

---

## 🔥 Características PWA

- Instalación como app en móviles y escritorio.
- Funciona offline para páginas cacheadas.
- Sincronización automática de datos con Supabase.
- Notificaciones sobre estado de conexión.

---

## 📦 Estructura del Proyecto

```bash
# 📁 Estructura de carpetas del proyecto Gym Master

/gym-master
├── /app                    # 📂 Estructura principal de rutas del sistema (Next.js App Router)
│   ├── /api                # 📡 Endpoints internos de la app (API Routes)
│   ├── /auth               # 🔐 Lógica de autenticación (login, callbacks, etc.)
│   ├── /dashboard          # 📊 Páginas principales del dashboard administrativo
│   ├── layout.tsx          # 🧱 Componente de layout general para el sistema
│   ├── page.tsx            # 🏠 Página raíz del proyecto
│   └── globals.css         # 🎨 Estilos globales compartidos
│
├── /components             # 🧩 Componentes reutilizables de UI
│   ├── /footer             # 📄 Pie de página (footer) del sistema
│   ├── /header             # 🔝 Encabezado general
│   ├── /horizontal-menu    # 📑 Menú horizontal superior
│   ├── /intro              # 🎥 Sección de introducción (pantalla inicial con video)
│   ├── /sidebar            # 📚 Menú lateral izquierdo
│   └── /ui                 # 🧱 Elementos de UI atómicos (botones, inputs, cards, etc.)
│
├── /hooks                  # 🪝 Custom Hooks para manejar lógica de React de forma modular
│
├── /lib                    # 🔧 Funciones auxiliares y herramientas generales
│
├── /pages                  # 📄 Ruta legacy (si se usa /api desde pages o documentación interna)
│
├── /services               # 🌐 Conexión con Supabase y lógica de acceso a datos
│
├── /types                  # 🧠 Tipado TypeScript compartido en todo el sistema
│
├── /public                 # 🖼️ Archivos estáticos: imágenes, íconos, videos, manifest, etc.
│
├── /.next                  # ⚙️ Carpeta generada automáticamente por Next.js (NO tocar)
│
├── /node_modules           # 📦 Dependencias instaladas (NO editar manualmente)
```

> ℹ️ Esta estructura modular permite escalar el proyecto, dividir roles entre desarrolladores y mantener el código organizado.
```

---

## 💻 Instalación y ejecución

1. Clonar el repositorio:
```bash
git clone https://github.com/GFGaldeano/gym-master.git
cd gym-master
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear `.env.local` con las siguientes variables:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXTAUTH_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...
```

4. Ejecutar la app:
```bash
npm run dev
```

---

## 🔃 Reglas de trabajo con ramas

- 🔒 No pushear directamente a `main`.
- 🌿 Trabajar sobre `develop` o `feature/*`.
- 🔃 Usar **Pull Requests** para fusionar cambios.
- ✍️ Commits con convenciones: `feat:`, `fix:`, `docs:`, etc.

---

## 📩 Contacto

**Dragon Pyramid**  
📧 contacto@dragonpyramid.com.ar  
🌐 [www.dragonpyramid.com.ar](http://www.dragonpyramid.com.ar)  


## ⚖️ Licencia

Este proyecto es de uso privado hasta su lanzamiento oficial.  
No se permite su distribución sin autorización.

---

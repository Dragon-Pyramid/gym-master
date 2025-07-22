-- Script SQL para la creación de tablas - Integración Backend de Datos
-- Gym Master - Dragon Pyramid
-- Ejecutar en Supabase SQL Editor

-- Tabla de usuarios base
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de socios (extiende usuarios)
CREATE TABLE IF NOT EXISTS socios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    genero VARCHAR(20) CHECK (genero IN ('masculino', 'femenino', 'otro')),
    numero_socio VARCHAR(50) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    fecha_alta DATE DEFAULT CURRENT_DATE,
    ultima_cuota_pagada DATE,
    imc DECIMAL(5,2),
    nivel_experiencia VARCHAR(20) DEFAULT 'principiante' CHECK (nivel_experiencia IN ('principiante', 'intermedio', 'avanzado')),
    objetivos TEXT[], -- Array de objetivos
    condiciones_medicas TEXT[], -- Array de condiciones médicas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de rutinas personalizadas
CREATE TABLE IF NOT EXISTS rutinas_personalizadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    ejercicios JSONB NOT NULL, -- JSON con array de ejercicios
    duracion_semanas INTEGER DEFAULT 4,
    dias_por_semana INTEGER DEFAULT 3,
    nivel_dificultad VARCHAR(20) CHECK (nivel_dificultad IN ('bajo', 'medio', 'alto')),
    generada_por_ia BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de dietas personalizadas
CREATE TABLE IF NOT EXISTS dietas_personalizadas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    calorias_objetivo INTEGER NOT NULL,
    macronutrientes JSONB NOT NULL, -- JSON con proteínas, carbohidratos, grasas
    comidas JSONB NOT NULL, -- JSON con array de comidas
    duracion_dias INTEGER DEFAULT 30,
    generada_por_ia BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de registros de asistencia
CREATE TABLE IF NOT EXISTS registros_asistencia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_entrada TIME NOT NULL,
    hora_salida TIME,
    rutina_realizada TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_socios_estado ON socios(estado);
CREATE INDEX IF NOT EXISTS idx_socios_numero ON socios(numero_socio);
CREATE INDEX IF NOT EXISTS idx_rutinas_socio ON rutinas_personalizadas(socio_id);
CREATE INDEX IF NOT EXISTS idx_dietas_socio ON dietas_personalizadas(socio_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_socio ON registros_asistencia(socio_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON registros_asistencia(fecha);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_socios_updated_at BEFORE UPDATE ON socios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) básico - Configurar según necesidades de seguridad
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutinas_personalizadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietas_personalizadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_asistencia ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según autenticación)
-- Nota: Estas políticas son básicas, se deben ajustar según el sistema de autenticación implementado

-- Los usuarios autenticados pueden ver todos los socios
CREATE POLICY "Ver socios" ON socios FOR SELECT USING (auth.role() = 'authenticated');

-- Los usuarios autenticados pueden insertar/actualizar socios
CREATE POLICY "Gestionar socios" ON socios FOR ALL USING (auth.role() = 'authenticated');

-- Políticas similares para otras tablas
CREATE POLICY "Ver rutinas" ON rutinas_personalizadas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gestionar rutinas" ON rutinas_personalizadas FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Ver dietas" ON dietas_personalizadas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gestionar dietas" ON dietas_personalizadas FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Ver asistencia" ON registros_asistencia FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gestionar asistencia" ON registros_asistencia FOR ALL USING (auth.role() = 'authenticated');
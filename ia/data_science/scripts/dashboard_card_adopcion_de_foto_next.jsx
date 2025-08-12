// app/components/AdopcionFotoCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { cn } from '@/lib/utils';

// =============================
// ⚙️ CONFIG
// =============================
// 1) Asegurate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local
// 2) Dar permisos de lectura (RLS) a las vistas v_adopcion_foto_global y v_adopcion_foto_por_rol (ver notas al final)

const supabaseRest = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1';
const headers = {
  apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};

// Tipos de datos
interface GlobalRow {
  total_usuarios: number;
  usuarios_con_foto: number;
  adopcion_pct: number;
}

interface RolRow {
  rol: string;
  total_por_rol: number;
  con_foto_por_rol: number;
  adopcion_pct: number;
}

export default function AdopcionFotoCard({ className }: { className?: string }) {
  const [global, setGlobal] = useState<GlobalRow | null>(null);
  const [porRol, setPorRol] = useState<RolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Global
        const gRes = await fetch(
          `${supabaseRest}/v_adopcion_foto_global?select=total_usuarios,usuarios_con_foto,adopcion_pct`,
          { headers, cache: 'no-store' }
        );
        if (!gRes.ok) throw new Error('Error cargando adopción global');
        const gJson: GlobalRow[] = await gRes.json();
        setGlobal(gJson?.[0] || null);

        // Por rol
        const rRes = await fetch(
          `${supabaseRest}/v_adopcion_foto_por_rol?select=rol,total_por_rol,con_foto_por_rol,adopcion_pct&order=rol.asc`,
          { headers, cache: 'no-store' }
        );
        if (!rRes.ok) throw new Error('Error cargando adopción por rol');
        const rJson: RolRow[] = await rRes.json();
        setPorRol(rJson || []);
      } catch (e: any) {
        setError(e?.message || 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pct = global?.adopcion_pct ?? 0;
  const meta = 50; // 🎯 meta inicial sugerida 50%
  const metaReached = pct >= meta;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Adopción de Foto de Perfil</span>
          {!loading && (
            <span
              className={cn(
                'text-xs px-2 py-1 rounded-2xl',
                metaReached ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              )}
            >
              {metaReached ? 'Meta alcanzada' : 'Bajo la meta'}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando métricas…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-5">
            {/* KPI Global */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <div className="text-4xl font-semibold">
                {pct.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%
              </div>
              <div className="text-sm text-muted-foreground">
                {global?.usuarios_con_foto ?? 0} de {global?.total_usuarios ?? 0} usuarios con foto
              </div>
              <div className="text-xs text-muted-foreground">Meta: {meta}%</div>
            </div>

            {/* Gráfico por rol */}
            <div className="md:col-span-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porRol} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <XAxis dataKey="rol" fontSize={12} />
                  <YAxis unit="%" fontSize={12} />
                  <Tooltip formatter={(v: any) => `${v}%`} labelFormatter={(l) => `Rol: ${l}`} />
                  <Bar dataKey="adopcion_pct" radius={[8, 8, 0, 0]}>
                    <LabelList dataKey="adopcion_pct" position="top" formatter={(v: any) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* =============================
📌 Notas de integración

1) ENV .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...

2) RLS (Row Level Security) para vistas
Si tenés RLS activado, creá una POLÍTICA de SELECT para el rol anónimo/usuario autenticado:

-- Para v_adopcion_foto_global
alter view if exists public.v_adopcion_foto_global owner to postgres; -- opcional
grant select on public.v_adopcion_foto_global to anon, authenticated;

-- Para v_adopcion_foto_por_rol
alter view if exists public.v_adopcion_foto_por_rol owner to postgres; -- opcional
grant select on public.v_adopcion_foto_por_rol to anon, authenticated;

En Supabase, las vistas heredan políticas de sus tablas base. Si las tablas tienen RLS estricto,
considerá crear SECURITY DEFINER functions o exponerlas vía edge function / endpoint de servidor.

3) Uso en una página

// app/(admin)/dashboard/page.tsx
import AdopcionFotoCard from '@/components/AdopcionFotoCard';

export default function AdminDashboard() {
  return (
    <div className="grid gap-6">
      <AdopcionFotoCard />
    </div>
  );
}

4) Accesibilidad & fallbacks
- Si no hay datos aún, el KPI muestra 0% y el gráfico queda vacío.
- Podés agregar un pequeño texto: "Aún no hay usuarios con foto".

5) Meta configurable
- Cambiá la constante `meta` o pasala como prop.

6) Seguridad
- Para evitar exponer ANON KEY en cliente, podés mover el fetch a un Server Component (`async` page) o a una Route Handler y leer con la Service Role Key del lado servidor.
============================= */

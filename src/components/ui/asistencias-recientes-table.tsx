'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchAsistenciasRecientes } from '@/services/qrService';
import type { AsistenciaReciente as AsistenciaRecienteApi } from '@/services/qrService';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';

interface AsistenciasRecientesTableProps {
  /** Forzar refetch externo cuando cambie */
  refreshTrigger?: number;
  /** Se dispara cuando llega una nueva asistencia (la más reciente cambia) */
  onNewAsistencia?: (a: AsistenciaRecienteApi) => void;
}

export default function AsistenciasRecientesTable({
  refreshTrigger,
  onNewAsistencia,
}: AsistenciasRecientesTableProps) {
  const [asistencias, setAsistencias] = useState<AsistenciaRecienteApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // protecciones
  const inFlight = useRef(false);
  const initializedRef = useRef(false);
  const lastTopIdRef = useRef<string | null>(null);

  const loadAsistencias = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setError(null);
      const raw = await fetchAsistenciasRecientes();

      // ——— Normalización robusta (acepta shape anidado o plano) ———
      const rows: any[] = Array.isArray(raw) ? raw : Object.values(raw ?? {});
      const normalized: AsistenciaRecienteApi[] = rows.map((r: any) => ({
        id: r.id,
        socio_id: r.socio_id,
        fecha: r.fecha,
        hora_ingreso: r.hora_ingreso,
        socio:
          r.socio ??
          (r.nombre_completo || r.foto
            ? {
                id_socio: r.id_socio,
                nombre_completo: r.nombre_completo,
                foto: r.foto ?? null,
              }
            : null),
      }));

      // ——— Deduplicado por id ———
      const seen = new Set<string>();
      const uniq: AsistenciaRecienteApi[] = [];
      for (const r of normalized) {
        if (!r || !r.id || seen.has(r.id)) continue;
        seen.add(r.id);
        uniq.push(r);
      }

      // ——— Orden estable: fecha ↓, hora_ingreso ↓, id ↓ ———
      uniq.sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
        if (a.hora_ingreso !== b.hora_ingreso)
          return a.hora_ingreso < b.hora_ingreso ? 1 : -1;
        return a.id < b.id ? 1 : -1;
      });

      // Detectar cambio en la primera fila (nueva asistencia)
      const top = uniq[0] ?? null;
      if (!initializedRef.current) {
        lastTopIdRef.current = top?.id ?? null;
        initializedRef.current = true;
      } else if (top && top.id && top.id !== lastTopIdRef.current) {
        lastTopIdRef.current = top.id;
        onNewAsistencia?.(top);
      }

      setAsistencias(uniq.slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  // Primer fetch y actualización por trigger externo
  useEffect(() => {
    loadAsistencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Realtime + fallback polling
  useEffect(() => {
    const channel = supabaseBrowser
      .channel('asistencias-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'asistencia' },
        () => loadAsistencias()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'asistencia' },
        () => loadAsistencias()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'asistencia' },
        () => loadAsistencias()
      )
      .subscribe();

    // Fallback por si Realtime no está habilitado o hay cortes de red
    const interval = setInterval(() => {
      if (!inFlight.current) loadAsistencias();
    }, 5000);

    return () => {
      supabaseBrowser.removeChannel(channel);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— Helpers de formato ———

  // Parseo local "YYYY-MM-DD" (evita que JS lo trate como UTC y reste un día)
  const formatFecha = (fechaISO: string) => {
    const [y, m, d] = (fechaISO ?? '').split('-').map(Number);
    const date = new Date(y || 0, (m || 1) - 1, d || 1);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Hora exacta "HH:MM:SS"
  const formatHora = (hhmmss: string) => {
    const [hh = '0', mm = '0', ss = '0'] = (hhmmss ?? '').split(':');
    const d = new Date();
    d.setHours(Number(hh), Number(mm), Number(ss), 0);
    return d.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // quitá esta línea si preferís 24h
    });
  };

  // ——— UI ———

  if (loading) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
            Asistencias Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg sm:p-5"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="w-10 h-10 rounded-full sm:w-12 sm:h-12" />
                <div className="space-y-2">
                  <Skeleton className="w-32 h-5 sm:w-40 sm:h-6" />
                  <Skeleton className="w-20 h-4 sm:w-24 sm:h-5" />
                </div>
              </div>
              <Skeleton className="w-16 h-7 sm:w-20 sm:h-8" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-destructive">
            <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
            Asistencias Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base sm:text-lg text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
          Asistencias Recientes
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {asistencias.length === 0 ? (
          <p className="py-6 text-base text-center sm:text-lg text-muted-foreground">
            No hay asistencias recientes
          </p>
        ) : (
          asistencias.map((row) => {
            const nombre = row.socio?.nombre_completo ?? 'Socio';
            const foto = row.socio?.foto ?? null;

            return (
              <div
                key={row.id}
                className="flex items-center justify-between p-4 transition-colors border rounded-lg sm:p-5 hover:bg-muted/50"
              >
                <div className="flex items-center flex-1 min-w-0 gap-3 sm:gap-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full sm:w-12 sm:h-12 bg-primary/10 overflow-hidden">
                    {foto ? (
                      <img
                        src={foto}
                        alt={nombre}
                        className="object-cover w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium truncate sm:text-lg">
                      {nombre}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {formatFecha(row.fecha)}
                    </p>
                  </div>
                </div>

                <span className="flex-shrink-0 px-3 py-2 ml-3 text-sm rounded-md bg-secondary text-secondary-foreground sm:px-4 sm:text-base">
                  {formatHora(row.hora_ingreso)}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

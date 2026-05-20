'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, DollarSign, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AdminCuotasEstadoResponse,
  EstadoCuotaSocio,
} from '@/interfaces/cuotaEstado.interface';
import { getAdminCuotasEstadoSocios } from '@/services/apiClient';

function formatDate(value: string | null): string {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function EstadoBadge({ estado }: { estado: EstadoCuotaSocio['estado_cuota'] }) {
  const className =
    estado === 'al_dia'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : estado === 'vencido'
      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';

  const label =
    estado === 'al_dia' ? 'Al día' : estado === 'vencido' ? 'Vencido' : 'Sin pagos';

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function SociosCriticosTable({ socios }: { socios: EstadoCuotaSocio[] }) {
  if (socios.length === 0) {
    return (
      <div className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
        No hay socios vencidos ni sin pagos para mostrar.
      </div>
    );
  }

  return (
    <div className='overflow-x-auto rounded-xl border'>
      <table className='w-full min-w-[760px] text-sm'>
        <thead className='bg-muted/60 text-left'>
          <tr>
            <th className='px-4 py-3 font-semibold'>Socio</th>
            <th className='px-4 py-3 font-semibold'>Estado</th>
            <th className='px-4 py-3 font-semibold'>Último pago</th>
            <th className='px-4 py-3 font-semibold'>Cobertura hasta</th>
            <th className='px-4 py-3 font-semibold'>Días vencido</th>
            <th className='px-4 py-3 font-semibold'>Método</th>
          </tr>
        </thead>
        <tbody>
          {socios.map((socio) => (
            <tr key={socio.id_socio} className='border-t'>
              <td className='px-4 py-3 font-medium'>{socio.nombre_completo}</td>
              <td className='px-4 py-3'>
                <EstadoBadge estado={socio.estado_cuota} />
              </td>
              <td className='px-4 py-3'>{formatDate(socio.ultimo_pago)}</td>
              <td className='px-4 py-3'>{formatDate(socio.periodo_hasta)}</td>
              <td className='px-4 py-3'>{socio.dias_vencido}</td>
              <td className='px-4 py-3 capitalize'>{socio.metodo_pago ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CuotasEstadoDashboard() {
  const [data, setData] = useState<AdminCuotasEstadoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const result = await getAdminCuotasEstadoSocios();

    if (result.ok && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'No se pudo obtener el estado de cuotas');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sociosCriticos = useMemo(() => {
    if (!data) return [];

    return [...data.vencidos, ...data.sin_pagos].sort((a, b) => {
      if (a.estado_cuota === b.estado_cuota) {
        return a.nombre_completo.localeCompare(b.nombre_completo);
      }

      return a.estado_cuota === 'vencido' ? -1 : 1;
    });
  }, [data]);

  const totalCobrado = useMemo(() => {
    if (!data) return 0;
    return data.pagos_por_metodo.reduce((acc, item) => acc + item.total_pagado, 0);
  }, [data]);

  if (loading) {
    return (
      <Card className='col-span-12'>
        <CardHeader>
          <CardTitle>Estado de cuotas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>Cargando estado de cuotas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='col-span-12 border-red-200 dark:border-red-900'>
        <CardHeader className='flex flex-row items-center justify-between gap-4'>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-500' />
            Estado de cuotas
          </CardTitle>
          <Button variant='outline' size='sm' onClick={fetchData}>
            Reintentar
          </Button>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-red-600 dark:text-red-300'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <section className='col-span-12 space-y-4'>
      <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Estado de cuotas</h2>
          <p className='text-sm text-muted-foreground'>
            Control operativo de socios al día, vencidos y sin pagos.
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={fetchData}>
          Actualizar
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Users className='h-4 w-4' />
              Total socios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{data.resumen.total_socios}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <CheckCircle2 className='h-4 w-4 text-emerald-500' />
              Al día
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-emerald-600'>{data.resumen.al_dia}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <AlertTriangle className='h-4 w-4 text-red-500' />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-red-600'>{data.resumen.vencidos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <AlertTriangle className='h-4 w-4 text-amber-500' />
              Sin pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-amber-600'>{data.resumen.sin_pagos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <DollarSign className='h-4 w-4' />
              Cobrado QA/actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatMoney(totalCobrado)}</div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader>
            <CardTitle>Socios con atención requerida</CardTitle>
          </CardHeader>
          <CardContent>
            <SociosCriticosTable socios={sociosCriticos} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5' />
              Pagos por método
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {data.pagos_por_metodo.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No hay pagos registrados.</p>
            ) : (
              data.pagos_por_metodo.map((item) => (
                <div
                  key={`${item.metodo_pago}-${item.estado}`}
                  className='flex items-center justify-between rounded-xl border p-3'
                >
                  <div>
                    <p className='font-semibold capitalize'>{item.metodo_pago}</p>
                    <p className='text-xs text-muted-foreground'>
                      {item.cantidad} pago(s) · {item.estado}
                    </p>
                  </div>
                  <p className='font-bold'>{formatMoney(item.total_pagado)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

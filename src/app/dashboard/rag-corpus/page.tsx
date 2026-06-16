'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Database, Loader2, Play, RefreshCw, ShieldAlert } from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { RagCorpusBatchAction, RagCorpusBatchResponse, RagCorpusStatusResponse } from '@/interfaces/ragCorpus.interface';
import { getRagCorpusStatusClient, runRagCorpusBatchClient } from '@/services/ragCorpusAdminClient';

const actionLabels: Record<RagCorpusBatchAction, string> = {
  ingest_exercises: 'Ingestar ejercicios',
  ingest_diet_rules: 'Ingestar dietas',
  vectorize_pending: 'Vectorizar pendientes',
  all: 'Tanda completa',
};

function progressPercent(indexed: number, total: number) {
  if (!total) return 0;
  return Math.round((indexed / total) * 100);
}

function StatusCard({ title, value, hint }: { title: string; value: number | string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export default function RagCorpusPage() {
  const [status, setStatus] = useState<RagCorpusStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<RagCorpusBatchAction | null>(null);
  const [lastRun, setLastRun] = useState<RagCorpusBatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const [delayMs, setDelayMs] = useState(1000);

  const exercisesPercent = useMemo(
    () => progressPercent(status?.sources.indexedExercises ?? 0, status?.sources.activeExercises ?? 0),
    [status],
  );

  const dietPercent = useMemo(
    () => progressPercent(status?.sources.indexedDietRules ?? 0, status?.sources.dietRules ?? 0),
    [status],
  );

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRagCorpusStatusClient();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar estado del corpus.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const runAction = async (action: RagCorpusBatchAction) => {
    setRunningAction(action);
    setError(null);
    try {
      const result = await runRagCorpusBatchClient({
        action,
        limit,
        delayMs,
        force: false,
        onlyMissing: true,
      });
      setLastRun(result);
      if (result.status) setStatus(result.status);
      else await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ejecutar la tanda RAG.');
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="RAG Corpus" />
          <main className="flex-1 space-y-6 p-6">
            <Card className="border-cyan-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="h-6 w-6 text-cyan-600" />
                    <h1 className="text-2xl font-bold text-slate-950">Estado del corpus RAG</h1>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    Panel administrativo para continuar la ingesta real del corpus del Coach IA por tandas controladas, con delay, pendientes y manejo seguro de límites 429.
                  </p>
                </div>

                <Button type="button" variant="outline" onClick={loadStatus} disabled={loading || Boolean(runningAction)}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Actualizar
                </Button>
              </div>
            </Card>

            {error ? (
              <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  {error}
                </div>
              </Card>
            ) : null}

            {status ? (
              <>
                <div className="grid gap-4 md:grid-cols-5">
                  <StatusCard title="Documentos" value={status.totals.documents} />
                  <StatusCard title="Chunks" value={status.totals.chunks} />
                  <StatusCard title="Vectorizados" value={status.totals.embeddedChunks} />
                  <StatusCard title="Pendientes" value={status.totals.pendingChunks} />
                  <StatusCard title="Dominios" value={status.domains.filter((domain) => domain.documents > 0).length} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-5">
                    <h2 className="font-semibold text-slate-950">Cobertura ejercicios</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {status.sources.indexedExercises} de {status.sources.activeExercises} ejercicios activos indexados.
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-cyan-600" style={{ width: `${exercisesPercent}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{exercisesPercent}%</p>
                  </Card>

                  <Card className="p-5">
                    <h2 className="font-semibold text-slate-950">Cobertura dietas</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {status.sources.indexedDietRules} de {status.sources.dietRules} reglas nutricionales indexadas.
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-lime-600" style={{ width: `${dietPercent}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{dietPercent}%</p>
                  </Card>
                </div>

                <Card className="p-5">
                  <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-950">
                    <Activity className="h-5 w-5 text-cyan-600" />
                    Ejecutar tandas controladas
                  </h2>

                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium">Límite</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={limit}
                        onChange={(event) => setLimit(Number(event.target.value))}
                        className="w-full rounded-md border px-3 py-2"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium">Delay ms</span>
                      <input
                        type="number"
                        min={0}
                        max={5000}
                        step={250}
                        value={delayMs}
                        onChange={(event) => setDelayMs(Number(event.target.value))}
                        className="w-full rounded-md border px-3 py-2"
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(Object.keys(actionLabels) as RagCorpusBatchAction[]).map((action) => (
                      <Button key={action} type="button" onClick={() => runAction(action)} disabled={Boolean(runningAction)}>
                        {runningAction === action ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        {actionLabels[action]}
                      </Button>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Recomendado para GitHub Models: tandas chicas, por ejemplo límite 10 y delay 1000 ms. Si aparece 429, continuar luego con “Vectorizar pendientes”.
                  </p>
                </Card>

                <Card className="p-5">
                  <h2 className="mb-3 font-semibold text-slate-950">Dominios del corpus</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Dominio</th>
                          <th className="px-3 py-2">Documentos</th>
                          <th className="px-3 py-2">Chunks</th>
                          <th className="px-3 py-2">Vectorizados</th>
                          <th className="px-3 py-2">Pendientes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {status.domains.map((domain) => (
                          <tr key={domain.domain} className="border-b">
                            <td className="px-3 py-2 font-medium">{domain.domain}</td>
                            <td className="px-3 py-2">{domain.documents}</td>
                            <td className="px-3 py-2">{domain.chunks}</td>
                            <td className="px-3 py-2">{domain.embeddedChunks}</td>
                            <td className="px-3 py-2">{domain.pendingChunks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {status.recommendations.length > 0 ? (
                  <Card className="p-5">
                    <h2 className="mb-2 font-semibold text-slate-950">Recomendaciones</h2>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {status.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
              </>
            ) : loading ? (
              <Card className="p-6 text-sm text-muted-foreground">Cargando estado del corpus...</Card>
            ) : null}

            {lastRun ? (
              <Card className="p-5">
                <h2 className="mb-2 font-semibold text-slate-950">Última ejecución</h2>
                <pre className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-50">
                  {JSON.stringify(lastRun, null, 2)}
                </pre>
              </Card>
            ) : null}
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

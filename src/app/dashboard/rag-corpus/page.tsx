'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Database,
  Dumbbell,
  FileText,
  Globe2,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useI18n } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import type { RagCorpusBatchAction, RagCorpusBatchResponse, RagCorpusStatusResponse } from '@/interfaces/ragCorpus.interface';
import { getRagCorpusStatusClient, runRagCorpusBatchClient } from '@/services/ragCorpusAdminClient';

function ragTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === 'en' ? en : es;
}

const ACTION_LABELS: Record<RagCorpusBatchAction, { es: string; en: string }> = {
  ingest_exercises: { es: 'Ingestar ejercicios', en: 'Ingest exercises' },
  ingest_diet_rules: { es: 'Ingestar dietas', en: 'Ingest diets' },
  vectorize_pending: { es: 'Vectorizar pendientes', en: 'Vectorize pending' },
  all: { es: 'Tanda completa', en: 'Full batch' },
};

const DOMAIN_LABELS: Record<string, { es: string; en: string }> = {
  exercise: { es: 'Ejercicios', en: 'Exercises' },
  diet_rule: { es: 'Reglas de dieta', en: 'Diet rules' },
  routine_rule: { es: 'Reglas de rutina', en: 'Routine rules' },
  safety: { es: 'Seguridad', en: 'Safety' },
  evolution: { es: 'Evolución', en: 'Evolution' },
  business: { es: 'Negocio', en: 'Business' },
  general: { es: 'General', en: 'General' },
};

function translateActionLabel(locale: GymMasterLocale, action: RagCorpusBatchAction) {
  const label = ACTION_LABELS[action];
  return locale === 'en' ? label.en : label.es;
}

function translateDomain(locale: GymMasterLocale, domain: string) {
  const label = DOMAIN_LABELS[domain];
  if (!label) return domain;
  return locale === 'en' ? label.en : label.es;
}

function normalizeCorpusText(value?: string | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function translateRecommendation(locale: GymMasterLocale, value: string) {
  if (locale !== 'en') return value;

  const normalized = normalizeCorpusText(value);
  if (normalized.includes('corpus base') && normalized.includes('ejercicios') && normalized.includes('dietas')) {
    return 'The base exercise and diet corpus does not show major pending items. Keep monitoring by domain.';
  }

  return value;
}

function formatCoverageText(locale: GymMasterLocale, indexed: number, total: number, esNoun: string, enNoun: string) {
  if (locale === 'en') {
    return `${indexed} of ${total} active ${enNoun} indexed.`;
  }

  return `${indexed} de ${total} ${esNoun} activos indexados.`;
}

function progressPercent(indexed: number, total: number) {
  if (!total) return 0;
  return Math.round((indexed / total) * 100);
}

function StatusCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-zinc-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-zinc-50">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground dark:text-zinc-400">{hint}</p> : null}
        </div>
        <span className="rounded-full bg-cyan-50 p-2 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

export default function RagCorpusPage() {
  const { locale } = useI18n();
  const c = (es: string, en: string) => ragTx(locale, es, en);

  const [status, setStatus] = useState<RagCorpusStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<RagCorpusBatchAction | null>(null);
  const [lastRun, setLastRun] = useState<RagCorpusBatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const [delayMs, setDelayMs] = useState(1000);

  const inputClassName =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500';

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
      setError(err instanceof Error ? err.message : c('No se pudo consultar estado del corpus.', 'Could not fetch corpus status.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err instanceof Error ? err.message : c('No se pudo ejecutar la tanda RAG.', 'Could not run the RAG batch.'));
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c('Corpus RAG', 'RAG Corpus')} />
          <main className="flex-1 space-y-6 bg-slate-50/40 p-6 text-slate-950 dark:bg-black dark:text-zinc-100">
            <Card className="border-cyan-100 bg-white p-6 shadow-sm dark:border-cyan-900/50 dark:bg-zinc-950/80 dark:text-zinc-100">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
                    <h1 className="text-2xl font-bold text-slate-950 dark:text-zinc-50">
                      {c('Estado del corpus RAG', 'RAG corpus status')}
                    </h1>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground dark:text-zinc-400">
                    {c(
                      'Panel administrativo para continuar la ingesta real del corpus del Coach IA por tandas controladas, con delay, pendientes y manejo seguro de límites 429.',
                      'Administrative panel to continue the real AI Coach corpus ingestion through controlled batches, with delay, pending items, and safe handling of 429 limits.',
                    )}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={loadStatus}
                  disabled={loading || Boolean(runningAction)}
                  className="dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {c('Actualizar', 'Refresh')}
                </Button>
              </div>
            </Card>

            {error ? (
              <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  {error}
                </div>
              </Card>
            ) : null}

            {status ? (
              <>
                <div className="grid gap-4 md:grid-cols-5">
                  <StatusCard title={c('Documentos', 'Documents')} value={status.totals.documents} icon={FileText} />
                  <StatusCard title="Chunks" value={status.totals.chunks} icon={Layers} />
                  <StatusCard title={c('Vectorizados', 'Vectorized')} value={status.totals.embeddedChunks} icon={CheckCircle2} />
                  <StatusCard title={c('Pendientes', 'Pending')} value={status.totals.pendingChunks} icon={Clock} />
                  <StatusCard
                    title={c('Dominios', 'Domains')}
                    value={status.domains.filter((domain) => domain.documents > 0).length}
                    icon={Globe2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
                    <h2 className="flex items-center gap-2 font-semibold text-slate-950 dark:text-zinc-50">
                      <Dumbbell className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                      {c('Cobertura ejercicios', 'Exercise coverage')}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400">
                      {formatCoverageText(
                        locale,
                        status.sources.indexedExercises,
                        status.sources.activeExercises,
                        'ejercicios',
                        'exercises',
                      )}
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
                      <div className="h-full bg-cyan-600 dark:bg-cyan-400" style={{ width: `${exercisesPercent}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground dark:text-zinc-400">{exercisesPercent}%</p>
                  </Card>

                  <Card className="border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
                    <h2 className="flex items-center gap-2 font-semibold text-slate-950 dark:text-zinc-50">
                      <Activity className="h-5 w-5 text-lime-600 dark:text-lime-300" />
                      {c('Cobertura dietas', 'Diet coverage')}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400">
                      {locale === 'en'
                        ? `${status.sources.indexedDietRules} of ${status.sources.dietRules} nutrition rules indexed.`
                        : `${status.sources.indexedDietRules} de ${status.sources.dietRules} reglas nutricionales indexadas.`}
                    </p>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
                      <div className="h-full bg-lime-600 dark:bg-lime-400" style={{ width: `${dietPercent}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground dark:text-zinc-400">{dietPercent}%</p>
                  </Card>
                </div>

                <Card className="border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
                  <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-950 dark:text-zinc-50">
                    <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                    {c('Ejecutar tandas controladas', 'Run controlled batches')}
                  </h2>

                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-slate-950 dark:text-zinc-100">{c('Límite', 'Limit')}</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={limit}
                        onChange={(event) => setLimit(Number(event.target.value))}
                        className={inputClassName}
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-slate-950 dark:text-zinc-100">{c('Delay ms', 'Delay (ms)')}</span>
                      <input
                        type="number"
                        min={0}
                        max={5000}
                        step={250}
                        value={delayMs}
                        onChange={(event) => setDelayMs(Number(event.target.value))}
                        className={inputClassName}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(Object.keys(ACTION_LABELS) as RagCorpusBatchAction[]).map((action) => (
                      <Button key={action} type="button" onClick={() => runAction(action)} disabled={Boolean(runningAction)}>
                        {runningAction === action ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                        {translateActionLabel(locale, action)}
                      </Button>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground dark:text-zinc-400">
                    {c(
                      'Recomendado: usar tandas controladas según el proveedor activo. Con OpenAI podés aumentar el límite progresivamente; si aparecen errores parciales, continuar luego con “Vectorizar pendientes”.',
                      'Recommended: use controlled batches according to the active provider. With OpenAI, you can progressively increase the limit; if partial errors appear, continue later with “Vectorize pending”.',
                    )}
                  </p>
                </Card>

                <Card className="border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
                  <h2 className="mb-3 font-semibold text-slate-950 dark:text-zinc-50">{c('Dominios del corpus', 'Corpus domains')}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-muted-foreground dark:bg-zinc-900/80 dark:text-zinc-400">
                        <tr>
                          <th className="px-3 py-2">{c('Dominio', 'Domain')}</th>
                          <th className="px-3 py-2">{c('Documentos', 'Documents')}</th>
                          <th className="px-3 py-2">Chunks</th>
                          <th className="px-3 py-2">{c('Vectorizados', 'Vectorized')}</th>
                          <th className="px-3 py-2">{c('Pendientes', 'Pending')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {status.domains.map((domain) => (
                          <tr key={domain.domain} className="border-b border-slate-200 dark:border-zinc-800">
                            <td className="px-3 py-2 font-medium text-slate-950 dark:text-zinc-100">
                              {translateDomain(locale, domain.domain)}
                            </td>
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
                  <Card className="border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
                    <h2 className="mb-2 font-semibold text-slate-950 dark:text-zinc-50">{c('Recomendaciones', 'Recommendations')}</h2>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground dark:text-zinc-400">
                      {status.recommendations.map((item) => (
                        <li key={item}>{translateRecommendation(locale, item)}</li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
              </>
            ) : loading ? (
              <Card className="border-slate-200 bg-white p-6 text-sm text-muted-foreground dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
                {c('Cargando estado del corpus...', 'Loading corpus status...')}
              </Card>
            ) : null}

            {lastRun ? (
              <Card className="border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-100">
                <h2 className="mb-2 font-semibold text-slate-950 dark:text-zinc-50">{c('Última ejecución', 'Last run')}</h2>
                <pre className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-50 dark:bg-black">
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

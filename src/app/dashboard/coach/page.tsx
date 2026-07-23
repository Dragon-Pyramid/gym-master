'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowRight,
  BookOpenCheck,
  Bot,
  Brain,
  CheckCircle2,
  Dumbbell,
  History,
  Info,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  SearchCheck,
  Send,
  Target,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type {
  RagCoachChatActionResult,
  RagCoachChatIntent,
  RagCoachChatSource,
  RagCoachContextSnapshot,
  RagCoachConversationMemory,
} from '@/interfaces/ragCoachChat.interface';
import type { Socio } from '@/interfaces/socio.interface';
import { enviarMensajeCoachIa } from '@/services/ragCoachChatClient';
import { fetchSociosApi } from '@/services/browser/socioApiClient';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCoreLevel, translateCoreObjective } from '@/utils/coreSeedI18n';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  actions?: RagCoachChatActionResult[];
  suggestedReplies?: string[];
  contextSummary?: string;
  contextHints?: string[];
  coachNotes?: string[];
  nextBestStep?: string;
  safetySummary?: string;
  qaSummary?: string;
  intent?: RagCoachChatIntent;
  missingParams?: string[];
  contextSnapshot?: RagCoachContextSnapshot;
  memoryHighlights?: string[];
  memoryTrace?: string[];
  contextConfidence?: 'alta' | 'media' | 'baja';
};

const coachCapabilities = [
  {
    titleEs: 'Rutinas',
    titleEn: 'Routines',
    descriptionEs: 'Genera planes usando objetivo, nivel, días y restricciones.',
    descriptionEn: 'Generate plans using goals, level, days, and restrictions.',
    icon: Dumbbell,
  },
  {
    titleEs: 'Dietas',
    titleEn: 'Diets',
    descriptionEs: 'Crea orientación nutricional con avisos de seguridad.',
    descriptionEn: 'Create nutrition guidance with safety notices.',
    icon: Apple,
  },
  {
    titleEs: 'Evolución',
    titleEn: 'Evolution',
    descriptionEs: 'Analiza progreso físico y sugiere próximos ajustes.',
    descriptionEn: 'Analyze physical progress and suggest next adjustments.',
    icon: Activity,
  },
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDisplayName(
  user: { nombre?: string | null; email?: string | null } | null | undefined,
  locale: string,
) {
  return user?.nombre?.trim() || user?.email?.trim() || coachTx(locale, 'socio', 'member');
}

function normalizeRole(value?: string | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '_');
}

function isAdminUserRole(value?: string | null) {
  const normalized = normalizeRole(value);
  return ['admin', 'administrador', 'administrator'].includes(normalized);
}

function coachTx(locale: string, es: string, en: string) {
  return locale === 'en' ? en : es;
}

function normalizeSearchText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function socioOptionLabel(socio: Socio, locale: string) {
  const name = socio.nombre_completo?.trim() || coachTx(locale, 'Socio sin nombre', 'Unnamed member');
  const dni = socio.dni?.trim();
  const email = socio.email?.trim();
  return [name, dni ? `${coachTx(locale, 'DNI', 'ID')} ${dni}` : null, email].filter(Boolean).join(' · ');
}

function shortSocioLabel(socio?: Socio | null) {
  if (!socio) return '';
  return socio.nombre_completo?.trim() || socio.email?.trim() || socio.id_socio;
}

function actionLinkLabel(action: RagCoachChatActionResult, locale: string) {
  if (action.viewLabel) return action.viewLabel;
  if (action.type === 'routine_generated') return coachTx(locale, 'Ir a rutinas', 'Go to routines');
  if (action.type === 'diet_generated') return coachTx(locale, 'Ir a dietas', 'Go to diets');
  if (action.type === 'evolution_analyzed') return coachTx(locale, 'Ir a evolución física', 'Go to physical evolution');
  return coachTx(locale, 'Abrir', 'Open');
}

function actionVisual(action: RagCoachChatActionResult, locale: string) {
  if (!action.ok) return { icon: AlertTriangle, label: coachTx(locale, 'Revisar', 'Review'), className: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100' };
  if (action.type === 'routine_generated') return { icon: Dumbbell, label: coachTx(locale, 'Rutina', 'Routine'), className: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100' };
  if (action.type === 'diet_generated') return { icon: Apple, label: coachTx(locale, 'Dieta', 'Diet'), className: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100' };
  if (action.type === 'evolution_analyzed') return { icon: Activity, label: coachTx(locale, 'Evolución', 'Evolution'), className: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100' };
  return { icon: MessageSquareText, label: coachTx(locale, 'Guía', 'Guidance'), className: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100' };
}

function intentLabel(intent: RagCoachChatIntent | undefined, locale: string) {
  if (intent === 'routine_request') return coachTx(locale, 'Rutina detectada', 'Routine detected');
  if (intent === 'diet_request') return coachTx(locale, 'Dieta detectada', 'Diet detected');
  if (intent === 'routine_and_diet_request') return coachTx(locale, 'Rutina + dieta', 'Routine + diet');
  if (intent === 'evolution_analysis_request') return coachTx(locale, 'Evolución detectada', 'Evolution detected');
  if (intent === 'general_guidance') return coachTx(locale, 'Orientación general', 'General guidance');
  if (intent === 'unknown') return coachTx(locale, 'Necesita más datos', 'More data needed');
  return null;
}

function formatSimilarity(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  const percentage = Math.max(0, Math.min(100, Math.round(value * 100)));
  return `${percentage}%`;
}

function hasSources(actions?: RagCoachChatActionResult[]) {
  return actions?.some((action) => (action.sources ?? []).length > 0) ?? false;
}

function getLatestAssistant(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'assistant');
}

function buildConversationMemory(
  previousMessages: ChatMessage[],
  pendingUserMessage: ChatMessage,
): RagCoachConversationMemory {
  const messagesForMemory = [...previousMessages, pendingUserMessage];
  const latestAssistant = getLatestAssistant(previousMessages);

  return {
    recentMessages: messagesForMemory.slice(-8).map((message) => ({
      role: message.role,
      content: message.content.slice(0, 280),
      intent: message.intent,
    })),
    lastAssistantIntent: latestAssistant?.intent,
    lastActionTypes: latestAssistant?.actions?.map((action) => action.type) ?? [],
    lastSuggestedReplies: latestAssistant?.suggestedReplies?.slice(0, 4) ?? [],
    pendingMissingParams: latestAssistant?.missingParams?.slice(0, 6) ?? [],
    lastNextBestStep: latestAssistant?.nextBestStep,
    lastContextSummary: latestAssistant?.contextSummary,
  };
}

function getLatestContextMessage(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === 'assistant' && (message.contextSnapshot || message.contextSummary));
}

function contextConfidenceLabel(value: 'alta' | 'media' | 'baja' | undefined, locale: string) {
  if (value === 'alta') return coachTx(locale, 'Alta', 'High');
  if (value === 'media') return coachTx(locale, 'Media', 'Medium');
  if (value === 'baja') return coachTx(locale, 'Baja', 'Low');
  return coachTx(locale, 'Pendiente', 'Pending');
}

function contextConfidenceClass(value?: 'alta' | 'media' | 'baja') {
  if (value === 'alta') return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100';
  if (value === 'media') return 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100';
  if (value === 'baja') return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100';
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200';
}


function renderSources(sources: RagCoachChatSource[], locale: string) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white/90 p-3 text-xs text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
      <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
        <BookOpenCheck className="h-3.5 w-3.5 text-[#02a8e1]" />
        {coachTx(locale, 'Fuentes recuperadas', 'Retrieved sources')}
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => {
          const similarity = formatSimilarity(source.similarity);
          return (
            <div key={`${source.title}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">{source.title}</span>
                {similarity && (
                  <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-100">
                    {coachTx(locale, 'similitud', 'similarity')} {similarity}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {source.domain && <span>{source.domain}</span>}
                {source.sourceTable && <span>· {source.sourceTable}</span>}
              </div>
              {source.contentPreview && (
                <p className="mt-1 line-clamp-2 text-slate-600 dark:text-slate-300">{source.contentPreview}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderAction(action: RagCoachChatActionResult, locale: string) {
  const visual = actionVisual(action, locale);
  const Icon = visual.icon;
  const qualityAudit = action.qualityAudit;

  return (
    <div key={`${action.type}-${action.title}`} className={`rounded-xl border p-3 ${visual.className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide">{visual.label}</span>
          </div>
          <h3 className="mt-1 text-sm font-bold">{action.title}</h3>
          <p className="mt-1 text-xs leading-relaxed opacity-90">{action.message}</p>
        </div>
        {action.viewPath && (
          <Button size="sm" variant="outline" asChild className="h-9 shrink-0 bg-white/80 text-xs dark:bg-slate-950/50">
            <Link href={action.viewPath}>
              {actionLinkLabel(action, locale)}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>

      {action.ragSummary && (
        <div className="mt-3 rounded-lg bg-white/70 p-2 text-xs leading-relaxed dark:bg-slate-950/40">
          <strong>{coachTx(locale, 'Resumen RAG:', 'RAG summary:')}</strong> {action.ragSummary}
        </div>
      )}

      {renderSources(action.sources ?? [], locale)}

      {qualityAudit && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {coachTx(locale, 'QA de calidad', 'Quality QA')} {qualityAudit.domain}
            </div>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-slate-950/50 dark:text-emerald-100">
              {qualityAudit.score}% · {qualityAudit.statusLabel}
            </span>
          </div>
          <p className="mb-2 leading-relaxed">{qualityAudit.summary}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {qualityAudit.checks.slice(0, 6).map((check) => (
              <div key={`${qualityAudit.domain}-${check.label}`} className="rounded-md bg-white/70 p-2 dark:bg-slate-950/40">
                <div className="font-semibold">
                  {check.status === 'blocked' ? coachTx(locale, 'Bloqueado', 'Blocked') : check.status === 'warning' ? coachTx(locale, 'Advertencia', 'Warning') : 'OK'} · {check.label}
                </div>
                <div className="mt-0.5 opacity-90">{check.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(action.safetyNotes?.length ?? 0) > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="mb-1 flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5" />
            {coachTx(locale, 'Seguridad aplicada', 'Applied safety')}
          </div>
          <ul className="list-disc space-y-1 pl-4">
            {action.safetyNotes?.slice(0, 3).map((note) => <li key={note}>{note}</li>)}
          </ul>
        </div>
      )}

      {(action.warnings?.length ?? 0) > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white/70 p-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
          <div className="mb-1 flex items-center gap-1.5 font-semibold">
            <Info className="h-3.5 w-3.5" />
            {coachTx(locale, 'Observaciones', 'Notes')}
          </div>
          <ul className="list-disc space-y-1 pl-4">
            {action.warnings?.slice(0, 3).map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function CoachIaPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const { locale } = useI18n();
  const c = useCallback((es: string, en: string) => coachTx(locale, es, en), [locale]);
  const displayName = useMemo(() => getDisplayName(user, locale), [locale, user]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [sociosLoading, setSociosLoading] = useState(false);
  const [sociosError, setSociosError] = useState<string | null>(null);
  const [selectedSocioId, setSelectedSocioId] = useState('');
  const [socioSearch, setSocioSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const totalAssistantMessages = messages.filter((message) => message.role === 'assistant').length;
  const totalActionMessages = messages.reduce((total, message) => total + (message.actions?.filter((action) => action.ok).length ?? 0), 0);
  const hasRagSources = messages.some((message) => hasSources(message.actions));
  const latestContextMessage = useMemo(() => getLatestContextMessage(messages), [messages]);
  const latestContextSnapshot = latestContextMessage?.contextSnapshot;
  const isAdminSession = useMemo(
    () => isAdminUserRole((user as any)?.rol || (user as any)?.role),
    [user],
  );
  const filteredSocios = useMemo(() => {
    const search = normalizeSearchText(socioSearch);
    const ordered = [...socios].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return (a.nombre_completo ?? '').localeCompare(b.nombre_completo ?? '', locale === 'en' ? 'en' : 'es');
    });

    if (!search) return ordered.slice(0, 80);

    return ordered
      .filter((socio) => {
        const haystack = normalizeSearchText([
          socio.nombre_completo,
          socio.dni,
          socio.email,
          socio.telefono,
        ].filter(Boolean).join(' '));
        return haystack.includes(search);
      })
      .slice(0, 80);
  }, [locale, socioSearch, socios]);
  const selectedSocio = useMemo(
    () => socios.find((socio) => socio.id_socio === selectedSocioId) ?? null,
    [selectedSocioId, socios],
  );
  const localizedQuickPrompts = useMemo(
    () => [
      c('Quiero una rutina para ganar masa muscular 3 días por semana', 'I want a routine to gain muscle mass 3 days per week'),
      c('Quiero una dieta para bajar grasa sin perder músculo', 'I want a diet to lose fat without losing muscle'),
      c('Estoy estancado, analizá mi evolución física', 'I am stuck, analyze my physical evolution'),
      c('No sé por dónde empezar, quiero mejorar mi físico', 'I do not know where to start, I want to improve my physique'),
    ],
    [c],
  );

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !isAdminSession) return;

    let isMounted = true;
    setSociosLoading(true);
    setSociosError(null);

    fetchSociosApi()
      .then((rows) => {
        if (!isMounted) return;
        setSocios(rows ?? []);
      })
      .catch((error) => {
        if (!isMounted) return;
        setSociosError(error instanceof Error ? error.message : c('No se pudo cargar el listado de socios.', 'The member list could not be loaded.'));
      })
      .finally(() => {
        if (isMounted) setSociosLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [c, isAdminSession, isAuthenticated, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || messages.length > 0) return;

    setMessages([
      {
        id: createId(),
        role: 'assistant',
        content: c(
          `Hola, ${displayName}. Soy tu Coach IA de Gym Master. Puedo ayudarte con rutinas, dietas y evolución física usando el contexto del socio cuando esté disponible.`,
          `Hello, ${displayName}. I am your Gym Master AI Coach. I can help you with routines, diets, and physical evolution using the member context when available.`,
        ),
        suggestedReplies: localizedQuickPrompts,
        nextBestStep: c('Contame tu objetivo, disponibilidad semanal, nivel y restricciones.', 'Tell me your goal, weekly availability, level, and restrictions.'),
      },
    ]);
  }, [c, displayName, isAuthenticated, isInitialized, localizedQuickPrompts, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {c('Cargando Coach IA...', 'Loading AI Coach...')}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || loading) return;

    setInput('');
    setLoading(true);

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: message,
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const effectiveSocioId = isAdminSession
        ? selectedSocioId || undefined
        : user?.id_socio || undefined;

      const res = await enviarMensajeCoachIa({
        message,
        socio_id: effectiveSocioId,
        locale: locale === 'en' ? 'en' : 'es',
        conversationContext: buildConversationMemory(messages, userMessage),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || c('No se pudo obtener respuesta del Coach IA.', 'A response could not be obtained from the AI Coach.'));
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: res.data.reply,
        actions: res.data.actions,
        suggestedReplies: res.data.suggestedReplies,
        contextSummary: res.data.contextSummary,
        contextHints: res.data.contextHints,
        coachNotes: res.data.coachNotes,
        nextBestStep: res.data.nextBestStep,
        safetySummary: res.data.safetySummary,
        qaSummary: res.data.qaSummary,
        intent: res.data.intent,
        missingParams: res.data.missingParams,
        contextSnapshot: res.data.contextSnapshot,
        memoryHighlights: res.data.memoryHighlights,
        memoryTrace: res.data.memoryTrace,
        contextConfidence: res.data.contextConfidence,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: error instanceof Error
            ? error.message
            : c('Ocurrió un error al consultar el Coach IA.', 'An error occurred while consulting the AI Coach.'),
          nextBestStep: c('Reintentá en unos segundos o revisá los módulos de rutinas, dietas y evolución desde el menú.', 'Try again in a few seconds or review the routines, diets, and physical evolution modules from the menu.'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const resetConversation = () => {
    setInput('');
    setMessages([
      {
        id: createId(),
        role: 'assistant',
        content: c(
          `Conversación reiniciada, ${displayName}. Contame qué objetivo querés trabajar ahora${selectedSocio ? ` para ${shortSocioLabel(selectedSocio)}` : ''}.`,
          `Conversation restarted, ${displayName}. Tell me which goal you want to work on now${selectedSocio ? ` for ${shortSocioLabel(selectedSocio)}` : ''}.`,
        ),
        suggestedReplies: localizedQuickPrompts,
        nextBestStep: c('Elegí una sugerencia o escribí tu consulta completa.', 'Choose a suggestion or write your full question.'),
      },
    ]);
  };

  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AppSidebar />
        <SidebarInset className="h-[100dvh] overflow-hidden bg-slate-50 dark:bg-slate-950">
          <AppHeader title={c("Coach IA", "AI Coach")} />
          <section className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 pb-4">
              <div className="overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 text-white shadow-xl dark:border-cyan-500/20 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      <Brain className="h-3.5 w-3.5" />
                      {c("RAG Coach con memoria contextual", "RAG Coach contextual memory")}
                    </div>
                    <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-4xl">
                      {c("Coach IA con memoria contextual del socio", "AI Coach with member contextual memory")}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                      {c("Consultá rutinas, dietas y evolución física con continuidad conversacional, contexto operativo y recomendaciones más personalizadas.", "Consult routines, diets and physical evolution with conversational continuity, operational context and more personalized recommendations.")}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur">
                      <div className="text-2xl font-black">{totalAssistantMessages}</div>
                      <div className="text-[11px] text-slate-300">{c("respuestas", "responses")}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur">
                      <div className="text-2xl font-black">{totalActionMessages}</div>
                      <div className="text-[11px] text-slate-300">{c("acciones", "actions")}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur">
                      <div className="text-2xl font-black">{hasRagSources ? c('Sí', 'Yes') : '—'}</div>
                      <div className="text-[11px] text-slate-300">{c("fuentes", "sources")}</div>
                    </div>
                  </div>
                </div>
              </div>

              {isAdminSession && (
                <Card className="rounded-3xl border-cyan-100 bg-white shadow-sm dark:border-cyan-500/20 dark:bg-slate-900">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                          <Users className="h-4 w-4 text-[#02a8e1]" />
                          {c("Socio operativo del Coach IA", "Operational member for AI Coach")}
                        </div>
                        <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {c("Como administrador, seleccioná un socio real antes de generar dietas, rutinas o análisis. El Coach enviará ese id_socio válido al backend.", "As an administrator, select a real member before generating diets, routines or analyses. The Coach will send that valid id_socio to the backend.")}
                        </p>
                        <div className="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                          <input
                            value={socioSearch}
                            onChange={(event) => setSocioSearch(event.target.value)}
                            placeholder={c("Buscar socio por nombre, DNI o email...", "Search member by name, ID or email...")}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#02a8e1] focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-500/20"
                          />
                          <select
                            value={selectedSocioId}
                            onChange={(event) => setSelectedSocioId(event.target.value)}
                            disabled={sociosLoading || filteredSocios.length === 0}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#02a8e1] focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-500/20"
                          >
                            <option value="">
                              {sociosLoading ? c('Cargando socios...', 'Loading members...') : c('Seleccionar socio para acciones automáticas', 'Select a member for automatic actions')}
                            </option>
                            {filteredSocios.map((socio) => (
                              <option key={socio.id_socio} value={socio.id_socio}>
                                {socioOptionLabel(socio, locale)}{socio.activo ? '' : c(' · Inactivo', ' · Inactive')}
                              </option>
                            ))}
                          </select>
                        </div>
                        {sociosError && (
                          <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">
                            {sociosError}
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300 lg:min-w-[280px]">
                        <div className="font-semibold text-slate-950 dark:text-white">
                          {selectedSocio ? shortSocioLabel(selectedSocio) : c('Sin socio seleccionado', 'No member selected')}
                        </div>
                        <div className="mt-1 leading-relaxed">
                          {selectedSocio
                            ? c('Las próximas respuestas podrán generar y guardar datos en módulos del socio seleccionado.', 'The next responses can generate and save data in the selected member modules.')
                            : c('Sin selección, el Coach solo dará orientación general segura y bloqueará acciones automáticas.', 'Without a selected member, the Coach will only provide safe general guidance and block automatic actions.')}
                        </div>
                        {selectedSocioId && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-3 h-8 rounded-xl text-xs dark:border-slate-700 dark:bg-slate-900"
                            onClick={() => setSelectedSocioId('')}
                            disabled={loading}
                          >
                            {c("Limpiar selección", "Clear selection")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <Card className="flex min-h-[70dvh] flex-col overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <CardHeader className="border-b border-slate-200 bg-white/95 p-4 dark:border-slate-800 dark:bg-slate-900/95">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#02a8e1] text-white shadow-lg shadow-cyan-500/20">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-black text-slate-950 dark:text-white">{c('Coach IA Gym Master', 'Gym Master AI Coach')}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{c('Chat unificado · Rutinas · Dietas · Evolución', 'Unified chat · Routines · Diets · Evolution')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {c('Fallback de seguridad', 'Safety fallback')}
                        </span>
                        <Button type="button" size="sm" variant="outline" onClick={resetConversation} disabled={loading}>
                          <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                          {c('Reiniciar', 'Reset')}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-3 sm:p-4">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70 sm:p-4">
                      {messages.length === 0 && !loading && (
                        <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
                          <Bot className="h-10 w-10 text-[#02a8e1]" />
                          <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{c('El Coach está listo', 'The Coach is ready')}</h3>
                          <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                            {c('Escribí una consulta o elegí una sugerencia para generar una respuesta contextual.', 'Write a question or choose a suggestion to generate a contextual response.')}
                          </p>
                        </div>
                      )}

                      {messages.map((message) => {
                        const label = intentLabel(message.intent, locale);
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.role === 'assistant' && (
                              <div className="mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#02a8e1] text-white shadow-md shadow-cyan-500/20 sm:flex">
                                <Bot className="h-4 w-4" />
                              </div>
                            )}

                            <div
                              className={`max-w-[94%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[86%] ${
                                message.role === 'user'
                                  ? 'bg-[#02a8e1] text-white'
                                  : 'border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {label && message.role === 'assistant' && (
                                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-100">
                                  <SearchCheck className="h-3 w-3" />
                                  {label}
                                </div>
                              )}

                              <div className="whitespace-pre-line">{message.content}</div>

                              {message.contextSummary && message.role === 'assistant' && (
                                <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-950 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100">
                                  <strong>{c('Contexto aplicado:', 'Applied context:')}</strong> {message.contextSummary}
                                </div>
                              )}

                              {message.contextSnapshot && message.role === 'assistant' && (
                                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                                  <div className="mb-2 flex items-center gap-1.5 font-semibold">
                                    <Target className="h-3.5 w-3.5" />
                                    {c('Memoria contextual', 'Contextual memory')}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                                    <span>{c('Objetivo:', 'Goal:')} {translateCoreObjective(message.contextSnapshot.objetivoLabel, locale)}</span>
                                    <span>{c('Nivel:', 'Level:')} {translateCoreLevel(message.contextSnapshot.nivelLabel, locale)}</span>
                                    <span>{c('Rutinas:', 'Routines:')} {message.contextSnapshot.rutinasTotal}</span>
                                    <span>{c('Dietas:', 'Diets:')} {message.contextSnapshot.dietasTotal}</span>
                                    <span>{c('Evolución:', 'Evolution:')} {message.contextSnapshot.evolucionTotal}</span>
                                    <span>{c('Asistencia 7d:', '7d attendance:')} {message.contextSnapshot.asistencia7Dias}</span>
                                    <span>{c('Puntaje:', 'Score:')} {message.contextSnapshot.readinessScore}%</span>
                                    <span>{message.contextSnapshot.readinessLabel}</span>
                                  </div>
                                </div>
                              )}

                              {message.safetySummary && message.role === 'assistant' && (
                                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                                  <strong>{c('Seguridad:', 'Safety:')}</strong> {message.safetySummary}
                                </div>
                              )}

                              {message.qaSummary && message.role === 'assistant' && (
                                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                                  <strong>{c('QA IA/RAG:', 'AI/RAG QA:')}</strong> {message.qaSummary}
                                </div>
                              )}

                              {(message.actions?.length ?? 0) > 0 && (
                                <div className="mt-3 space-y-3">
                                  {message.actions?.map((action) => renderAction(action, locale))}
                                </div>
                              )}

                              {(message.contextHints?.length ?? 0) > 0 && message.role === 'assistant' && (
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                                  <div className="mb-1 font-semibold">{c('Pistas del contexto', 'Context hints')}</div>
                                  <ul className="list-disc space-y-1 pl-4">
                                    {message.contextHints?.slice(0, 3).map((hint) => <li key={hint}>{hint}</li>)}
                                  </ul>
                                </div>
                              )}

                              {(message.memoryHighlights?.length ?? 0) > 0 && message.role === 'assistant' && (
                                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-950 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100">
                                  <div className="mb-1 font-semibold">{c('Memoria recordada', 'Remembered context')}</div>
                                  <ul className="list-disc space-y-1 pl-4">
                                    {message.memoryHighlights?.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                                  </ul>
                                </div>
                              )}

                              {(message.memoryTrace?.length ?? 0) > 0 && message.role === 'assistant' && (
                                <details className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                                  <summary className="cursor-pointer font-semibold">{c('Trazabilidad contextual', 'Context trace')}</summary>
                                  <ul className="mt-2 list-disc space-y-1 pl-4">
                                    {message.memoryTrace?.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
                                  </ul>
                                </details>
                              )}

                              {(message.missingParams?.length ?? 0) > 0 && message.role === 'assistant' && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                  {message.missingParams?.map((param) => (
                                    <span key={param} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {c('falta:', 'missing:')} {param}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {message.nextBestStep && message.role === 'assistant' && (
                                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs text-violet-950 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100">
                                  <strong>{c('Próximo paso:', 'Next step:')}</strong> {message.nextBestStep}
                                </div>
                              )}

                              {message.suggestedReplies && message.suggestedReplies.length > 0 && message.role === 'assistant' && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.suggestedReplies.slice(0, 4).map((suggestion) => (
                                    <button
                                      type="button"
                                      key={suggestion}
                                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-[#02a8e1] hover:text-[#027ca8] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-100"
                                      onClick={() => sendMessage(suggestion)}
                                      disabled={loading}
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {message.role === 'user' && (
                              <div className="mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-700 text-white shadow-md dark:bg-slate-600 sm:flex">
                                <UserRound className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {loading && (
                        <div className="flex items-center gap-3 rounded-2xl border border-cyan-100 bg-white p-3 text-sm text-slate-600 shadow-sm dark:border-cyan-500/20 dark:bg-slate-900 dark:text-slate-300">
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#02a8e1] text-white">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{c('Analizando contexto del socio', 'Analyzing member context')}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{c('Buscando rutinas, dietas, evolución y referencias RAG disponibles...', 'Searching available routines, diets, evolution data, and RAG references...')}</div>
                          </div>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                      {localizedQuickPrompts.map((prompt) => (
                        <Button
                          key={prompt}
                          type="button"
                          variant="outline"
                          className="h-auto justify-start whitespace-normal rounded-2xl py-3 text-left text-xs dark:border-slate-700 dark:bg-slate-950/50"
                          onClick={() => sendMessage(prompt)}
                          disabled={loading}
                        >
                          <Sparkles className="mr-2 h-4 w-4 shrink-0 text-[#02a8e1]" />
                          {prompt}
                        </Button>
                      ))}
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
                      <textarea
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder={c('Escribí tu consulta: quiero rutina, dieta, revisar progreso...', 'Write your question: I want a routine, diet, or progress review...')}
                        className="min-h-14 flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#02a8e1] focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-500/20"
                        maxLength={1600}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void sendMessage(input);
                          }
                        }}
                      />
                      <Button type="submit" disabled={loading || !input.trim()} className="h-14 rounded-2xl bg-[#02a8e1] px-5 font-semibold hover:bg-[#0288b1]">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="ml-2 sm:hidden md:inline">{c('Enviar', 'Send')}</span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <aside className="space-y-4">
                  <Card className="rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-[#02a8e1]" />
                        <h2 className="text-base font-bold text-slate-950 dark:text-white">{c('Memoria contextual', 'Contextual memory')}</h2>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                      <div className={`rounded-2xl border px-3 py-2 text-xs font-semibold ${contextConfidenceClass(latestContextMessage?.contextConfidence)}`}>
                        {c('Confianza:', 'Confidence:')} {contextConfidenceLabel(latestContextMessage?.contextConfidence, locale)}
                      </div>
                      {latestContextSnapshot ? (
                        <div className="space-y-2 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-950/60">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-400">{c('Objetivo', 'Goal')}</span>
                            <strong className="text-right text-slate-900 dark:text-white">{translateCoreObjective(latestContextSnapshot.objetivoLabel, locale)}</strong>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-400">{c('Nivel', 'Level')}</span>
                            <strong className="text-right text-slate-900 dark:text-white">{translateCoreLevel(latestContextSnapshot.nivelLabel, locale)}</strong>
                          </div>
                          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                            <div className="rounded-xl bg-white p-2 dark:bg-slate-900">
                              <div className="font-black text-slate-950 dark:text-white">{latestContextSnapshot.rutinasTotal}</div>
                              <div className="text-[10px]">{c('rutinas', 'routines')}</div>
                            </div>
                            <div className="rounded-xl bg-white p-2 dark:bg-slate-900">
                              <div className="font-black text-slate-950 dark:text-white">{latestContextSnapshot.dietasTotal}</div>
                              <div className="text-[10px]">{c('dietas', 'diets')}</div>
                            </div>
                            <div className="rounded-xl bg-white p-2 dark:bg-slate-900">
                              <div className="font-black text-slate-950 dark:text-white">{latestContextSnapshot.evolucionTotal}</div>
                              <div className="text-[10px]">{c('evolución', 'evolution')}</div>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-1 flex items-center justify-between text-[11px]">
                              <span>{c('Puntaje contextual', 'Context score')}</span>
                              <strong>{latestContextSnapshot.readinessScore}%</strong>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                              <div className="h-full rounded-full bg-[#02a8e1]" style={{ width: `${latestContextSnapshot.readinessScore}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-950/60">
                          {c('Todavía no hay memoria contextual calculada. Enviá una consulta para que el Coach lea el contexto del socio.', 'There is no calculated contextual memory yet. Send a question so the Coach can read the member context.')}
                        </p>
                      )}
                      {(latestContextMessage?.memoryHighlights?.length ?? 0) > 0 && (
                        <div className="space-y-1 rounded-2xl border border-slate-200 p-3 text-xs dark:border-slate-700">
                          <div className="font-semibold text-slate-950 dark:text-white">{c('Recordado', 'Remembered')}</div>
                          {latestContextMessage?.memoryHighlights?.slice(0, 3).map((item) => (
                            <p key={item}>• {item}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <h2 className="text-base font-bold text-slate-950 dark:text-white">{c('Checklist de calidad', 'Quality checklist')}</h2>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {[
                        c('Memoria conversacional visible.', 'Visible conversational memory.'),
                        c('Contexto operativo del socio resumido.', 'Summarized operational member context.'),
                        c('Fallback seguro para señales sensibles.', 'Safe fallback for sensitive signals.'),
                        c('Acciones claras para ver rutina, dieta o evolución.', 'Clear actions to view routines, diets, or evolution.'),
                        c('Diseño responsive sin scroll horizontal.', 'Responsive design without horizontal scrolling.'),
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-950/60">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#02a8e1]" />
                        <h2 className="text-base font-bold text-slate-950 dark:text-white">{c('Qué puede hacer', 'What it can do')}</h2>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {coachCapabilities.map((capability) => {
                        const Icon = capability.icon;
                        return (
                          <div key={capability.titleEs} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                              <Icon className="h-4 w-4 text-[#02a8e1]" />
                              {c(capability.titleEs, capability.titleEn)}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{c(capability.descriptionEs, capability.descriptionEn)}</p>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-amber-200 bg-amber-50 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                    <CardContent className="p-4 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
                      <div className="mb-2 flex items-center gap-2 font-bold">
                        <AlertTriangle className="h-4 w-4" />
                        {c('Nota importante', 'Important note')}
                      </div>
                      {c('El Coach IA orienta y ayuda a organizar información del gimnasio. No reemplaza evaluación médica, nutricional ni profesional cuando hay lesiones, síntomas o condiciones clínicas.', 'The AI Coach provides guidance and helps organize gym information. It does not replace medical, nutritional, or professional evaluation for injuries, symptoms, or clinical conditions.')}
                    </CardContent>
                  </Card>
                </aside>
              </div>
            </div>
          </section>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Loader2, Send, Sparkles, UserRound } from 'lucide-react';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { RagCoachChatActionResult } from '@/interfaces/ragCoachChat.interface';
import { enviarMensajeCoachIa } from '@/services/ragCoachChatClient';
import { useAuthStore } from '@/stores/authStore';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  actions?: RagCoachChatActionResult[];
  suggestedReplies?: string[];
  contextSummary?: string;
};

const quickPrompts = [
  'Quiero una rutina para ganar masa muscular 3 días por semana',
  'Quiero una dieta para bajar grasa sin perder músculo',
  'Estoy estancado, analizá mi evolución física',
  'No sé por dónde empezar, quiero mejorar mi físico',
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDisplayName(user?: { nombre?: string | null; email?: string | null } | null) {
  return user?.nombre?.trim() || user?.email?.trim() || 'socio';
}

function actionLinkLabel(action: RagCoachChatActionResult) {
  if (action.viewLabel) return action.viewLabel;
  if (action.type === 'routine_generated') return 'Ir a rutinas';
  if (action.type === 'diet_generated') return 'Ir a dietas';
  if (action.type === 'evolution_analyzed') return 'Ir a evolución física';
  return 'Abrir';
}

export default function CoachIaPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isInitialized } = useAuthStore();
  const displayName = useMemo(() => getDisplayName(user), [user]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || messages.length > 0) return;

    setMessages([
      {
        id: createId(),
        role: 'assistant',
        content: `Hola, ${displayName}, ¿en qué te puedo ayudar? Puedo ayudarte con rutinas, dietas o evolución física.`,
        suggestedReplies: quickPrompts,
      },
    ]);
  }, [displayName, isAuthenticated, isInitialized, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isInitialized) {
    return <div>Cargando...</div>;
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
      const res = await enviarMensajeCoachIa({ message, socio_id: user?.id_socio || 'me' });

      if (!res.ok || !res.data) {
        throw new Error(res.error || 'No se pudo obtener respuesta del Coach IA.');
      }

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: res.data.reply,
        actions: res.data.actions,
        suggestedReplies: res.data.suggestedReplies,
        contextSummary: res.data.contextSummary,
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
            : 'Ocurrió un error al consultar el Coach IA.',
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Coach IA" />
          <main className="flex-1 p-6">
            <Card className="mx-auto flex min-h-[72vh] w-full max-w-5xl flex-col rounded-2xl border bg-white shadow-sm">
              <CardHeader className="border-b p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Bot className="h-6 w-6 text-[#02a8e1]" />
                      <h1 className="text-2xl font-bold text-gray-950">Coach IA Gym Master</h1>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Conversá sobre rutinas, dietas y evolución física. El Coach puede generar y guardar resultados cuando corresponda.
                    </p>
                  </div>
                  <div className="hidden rounded-full bg-[#02a8e1]/10 px-3 py-1 text-xs font-semibold text-[#027ca8] md:block">
                    RAG Coach Unificado
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex-1 space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#02a8e1] text-white">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                          message.role === 'user'
                            ? 'bg-[#02a8e1] text-white'
                            : 'border bg-white text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-line">{message.content}</div>

                        {message.contextSummary && message.role === 'assistant' && (
                          <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
                            <strong>Contexto aplicado:</strong> {message.contextSummary}
                          </div>
                        )}

                        {message.actions?.some((action) => action.viewPath) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.actions
                              .filter((action) => action.viewPath)
                              .map((action) => (
                                <Button key={`${action.type}-${action.viewPath}`} size="sm" variant="outline" asChild>
                                  <Link href={action.viewPath ?? '/dashboard'}>
                                    {actionLinkLabel(action)}
                                  </Link>
                                </Button>
                              ))}
                          </div>
                        )}

                        {message.suggestedReplies && message.suggestedReplies.length > 0 && message.role === 'assistant' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.suggestedReplies.slice(0, 4).map((suggestion) => (
                              <button
                                type="button"
                                key={suggestion}
                                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition hover:border-[#02a8e1] hover:text-[#027ca8]"
                                onClick={() => sendMessage(suggestion)}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white">
                          <UserRound className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#02a8e1] text-white">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      El Coach IA está analizando tu pedido...
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  {quickPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      type="button"
                      variant="outline"
                      className="h-auto justify-start whitespace-normal text-left text-xs"
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                    >
                      <Sparkles className="mr-2 h-4 w-4 shrink-0 text-[#02a8e1]" />
                      {prompt}
                    </Button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Escribí tu consulta: quiero rutina, dieta, revisar progreso..."
                    className="min-h-12 flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#02a8e1]"
                    maxLength={1600}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage(input);
                      }
                    }}
                  />
                  <Button type="submit" disabled={loading || !input.trim()} className="h-12 bg-[#02a8e1] hover:bg-[#0288b1]">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

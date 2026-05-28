'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageSquareText,
  Mic,
  MicOff,
  Sparkles,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';

import { AppFooter } from '@/components/footer/AppFooter';
import { AppHeader } from '@/components/header/AppHeader';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Nivel } from '@/interfaces/niveles.interface';
import { Objetivo } from '@/interfaces/objetivo.interface';
import { RagRutinasAssistantResponseData } from '@/interfaces/ragRutinasAssistant.interface';
import { getNiveles, getObjetivos } from '@/services/apiClient';
import { generarRutinaConAsistente } from '@/services/ragRutinasAssistantService';
import { useAuthStore } from '@/stores/authStore';

const DIAS_DISPONIBLES = [1, 2, 3, 4, 5, 6];

type SpeechRecognitionAlternativeLite = {
  transcript: string;
  confidence?: number;
};

type SpeechRecognitionResultLite = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLite;
};

type SpeechRecognitionResultListLite = {
  length: number;
  [index: number]: SpeechRecognitionResultLite;
};

type SpeechRecognitionEventLite = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultListLite;
};

type SpeechRecognitionErrorEventLite = Event & {
  error: string;
  message?: string;
};

type BrowserSpeechRecognition = EventTarget & {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLite) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLite) => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

type DetectedAssistantIntent = {
  objetivoNombre?: string;
  nivelNombre?: string;
  dias?: number;
  prioridadesMusculares?: string[];
  restriccionesDetectadas?: string[];
};

function normalizeAssistantText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findCatalogItemByKeywords<T>(
  items: T[],
  getLabel: (item: T) => string | undefined,
  keywords: string[]
): T | undefined {
  return items.find((item) => {
    const label = normalizeAssistantText(getLabel(item) ?? '');
    return keywords.some((keyword) => label.includes(normalizeAssistantText(keyword)));
  });
}

function extractTrainingDays(text: string): number | undefined {
  const normalized = normalizeAssistantText(text);
  const directMatch = normalized.match(/(?:^|\D)([1-6])\s*(?:dias?|veces|entrenamientos?)(?:\s+por\s+semana)?(?:\D|$)/);

  if (directMatch?.[1]) {
    return Number(directMatch[1]);
  }

  const wordMap: Record<string, number> = {
    un: 1,
    una: 1,
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
  };

  for (const [word, value] of Object.entries(wordMap)) {
    const pattern = new RegExp(`\\b${word}\\s+(dias?|veces|entrenamientos?)(\\s+por\\s+semana)?\\b`);
    if (pattern.test(normalized)) return value;
  }

  return undefined;
}

function appendUniqueRestriction(current: string, restriction: string) {
  if (normalizeAssistantText(current).includes(normalizeAssistantText(restriction))) {
    return current;
  }

  return `${current}${current.trim() ? ' | ' : ''}${restriction}`.slice(0, 1200);
}

function extractMusclePriorities(text: string) {
  const normalized = normalizeAssistantText(text);
  const priorities: string[] = [];

  const candidates: Array<[string, RegExp]> = [
    ['Pecho', /\b(pecho|pectorales?)\b/],
    ['Espalda', /\b(espalda|dorsales?)\b/],
    ['Hombros', /\b(hombros?|deltoides?)\b/],
    ['Brazos', /\b(brazos?)\b/],
    ['Bíceps', /\b(biceps)\b/],
    ['Tríceps', /\b(triceps)\b/],
    ['Piernas', /\b(piernas?|cuadriceps|isquios?)\b/],
    ['Glúteos', /\b(gluteos?)\b/],
    ['Abdominales', /\b(abdominales?|core|zona media)\b/],
  ];

  for (const [label, pattern] of candidates) {
    if (pattern.test(normalized)) priorities.push(label);
  }

  return priorities;
}

function isAdminRole(role?: string | null) {
  const normalized = role?.trim().toLowerCase();
  return normalized === 'admin' || normalized === 'administrador';
}

export default function RutinasAssistantPage() {
  const router = useRouter();
  const { user, isAuthenticated, initializeAuth, isInitialized, token } = useAuthStore();

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [objetivo, setObjetivo] = useState<string>('1');
  const [nivel, setNivel] = useState<string>('1');
  const [dias, setDias] = useState<number>(3);
  const [idioma, setIdioma] = useState<'es' | 'en'>('es');
  const [mensajeSocio, setMensajeSocio] = useState('');
  const [restricciones, setRestricciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagRutinasAssistantResponseData | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<DetectedAssistantIntent>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [guidanceMessage, setGuidanceMessage] = useState('');
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceSessionBaseRef = useRef('');
  const finalTranscriptRef = useRef('');
  const latestMessageRef = useRef('');

  const usuarioEsAdmin = isAdminRole(user?.rol);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    latestMessageRef.current = mensajeSocio;
  }, [mensajeSocio]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setSpeechSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

    return () => {
      shouldKeepListeningRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const cargarCatalogos = useCallback(async () => {
    if (!token) return;

    try {
      const [objetivosResponse, nivelesResponse] = await Promise.all([
        getObjetivos(),
        getNiveles(),
      ]);

      if (objetivosResponse.ok) {
        const objetivosData = objetivosResponse.data ?? [];
        setObjetivos(objetivosData);
        if (objetivosData[0]?.id_objetivo) setObjetivo(String(objetivosData[0].id_objetivo));
      }

      if (nivelesResponse.ok) {
        const nivelesData = nivelesResponse.data ?? [];
        setNiveles(nivelesData);
        if (nivelesData[0]?.id_nivel) setNivel(String(nivelesData[0].id_nivel));
      }
    } catch (error) {
      console.error('Error al cargar catálogos del asistente:', error);
      toast.error('No se pudieron cargar objetivos y niveles');
    }
  }, [token]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && token) {
      cargarCatalogos();
    }
  }, [cargarCatalogos, isAuthenticated, isInitialized, token]);

  const objetivoSeleccionado = useMemo(
    () => objetivos.find((item) => String(item.id_objetivo) === objetivo)?.nombre_objetivo ?? `Objetivo ${objetivo}`,
    [objetivo, objetivos]
  );

  const nivelSeleccionado = useMemo(
    () => niveles.find((item) => String(item.id_nivel) === nivel)?.nombre_nivel ?? `Nivel ${nivel}`,
    [nivel, niveles]
  );

  const inferIntentFromText = useCallback((rawText: string) => {
    const normalized = normalizeAssistantText(rawText);
    if (!normalized) {
      setDetectedIntent({});
      return;
    }

    const nextIntent: DetectedAssistantIntent = {};

    const detectedDays = extractTrainingDays(rawText);
    if (detectedDays && detectedDays !== dias) {
      setDias(detectedDays);
      nextIntent.dias = detectedDays;
    } else if (detectedDays) {
      nextIntent.dias = detectedDays;
    }

    let detectedObjective: Objetivo | undefined;

    if (/(volumen|hipertrofia|masa muscular|ganar masa|aumentar masa|crear musculo|ganar musculo)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['volumen']);
    } else if (/(definicion|definir|marcar|marcado)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['definicion']);
    } else if (/(bajar de peso|perder peso|adelgazar|bajar grasa|perder grasa|descenso de grasa)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['bajar de peso']);
    } else if (/(fuerza|mas fuerte|aumentar fuerza)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['aumentar fuerza', 'fuerza']);
    } else if (/(resistencia|aguante|cardio|capacidad aerobica)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['mejorar resistencia', 'resistencia']);
    }

    if (detectedObjective?.id_objetivo && String(detectedObjective.id_objetivo) !== objetivo) {
      setObjetivo(String(detectedObjective.id_objetivo));
      nextIntent.objetivoNombre = detectedObjective.nombre_objetivo;
    } else if (detectedObjective?.nombre_objetivo) {
      nextIntent.objetivoNombre = detectedObjective.nombre_objetivo;
    }

    let detectedLevel: Nivel | undefined;

    if (/(inicial|principiante|empiezo|recien empiezo|nuevo)/.test(normalized)) {
      detectedLevel = findCatalogItemByKeywords(niveles, (item) => item.nombre_nivel, ['inicial']);
    } else if (/(intermedio|hace rato|algo de experiencia)/.test(normalized)) {
      detectedLevel = findCatalogItemByKeywords(niveles, (item) => item.nombre_nivel, ['intermedio']);
    } else if (/(avanzado|experto|muchos anos|mucha experiencia)/.test(normalized)) {
      detectedLevel = findCatalogItemByKeywords(niveles, (item) => item.nombre_nivel, ['avanzado']);
    }

    if (detectedLevel?.id_nivel && String(detectedLevel.id_nivel) !== nivel) {
      setNivel(String(detectedLevel.id_nivel));
      nextIntent.nivelNombre = detectedLevel.nombre_nivel;
    } else if (detectedLevel?.nombre_nivel) {
      nextIntent.nivelNombre = detectedLevel.nombre_nivel;
    }

    const priorities = extractMusclePriorities(rawText);
    if (priorities.length > 0) {
      nextIntent.prioridadesMusculares = priorities;
    }

    const detectedRestrictions: string[] = [];

    if (/(lumbalgia|dolor lumbar|zona lumbar|hernia|ciatica|ciatico)/.test(normalized)) {
      const lumbarRestriction = 'Lumbalgia/dolor lumbar informado: evitar ejercicios de alto riesgo lumbar y priorizar variantes controladas.';
      setRestricciones((current) => appendUniqueRestriction(current, lumbarRestriction));
      detectedRestrictions.push('lumbalgia/dolor lumbar');
    }

    if (/(lesion|lesionado|dolor|molestia)/.test(normalized) && detectedRestrictions.length === 0) {
      detectedRestrictions.push('posible restricción física');
    }

    if (detectedRestrictions.length > 0) {
      nextIntent.restriccionesDetectadas = detectedRestrictions;
    }

    setDetectedIntent(nextIntent);
  }, [dias, nivel, niveles, objetivo, objetivos]);

  useEffect(() => {
    inferIntentFromText(`${mensajeSocio} ${restricciones}`);
  }, [inferIntentFromText, mensajeSocio, restricciones]);

  useEffect(() => {
    setReviewMode(false);
    setGuidanceMessage('');
  }, [mensajeSocio, restricciones]);

  const buildSpeechRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const RecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionConstructor) return null;

    return new RecognitionConstructor();
  }, []);

  const startSpeechRecognition = useCallback(() => {
    const recognition = buildSpeechRecognition();
    if (!recognition) {
      toast.error('Tu navegador no soporta dictado por voz. Podés escribir el texto manualmente.');
      shouldKeepListeningRef.current = false;
      setIsListening(false);
      return;
    }

    voiceSessionBaseRef.current = latestMessageRef.current.trim();
    finalTranscriptRef.current = '';
    setInterimTranscript('');

    recognition.lang = idioma === 'en' ? 'en-US' : 'es-AR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let index = 0; index < event.results.length; index += 1) {
        const resultItem = event.results[index];
        const transcript = resultItem?.[0]?.transcript ?? '';

        if (resultItem?.isFinal) {
          finalText += ` ${transcript}`;
        } else {
          interimText += ` ${transcript}`;
        }
      }

      finalTranscriptRef.current = finalText.replace(/\s+/g, ' ').trim();
      const cleanInterim = interimText.replace(/\s+/g, ' ').trim();
      setInterimTranscript(cleanInterim);

      const nextText = `${voiceSessionBaseRef.current}${voiceSessionBaseRef.current && (finalTranscriptRef.current || cleanInterim) ? ' ' : ''}${finalTranscriptRef.current}${finalTranscriptRef.current && cleanInterim ? ' ' : ''}${cleanInterim}`
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1200);

      latestMessageRef.current = nextText;
      setMensajeSocio(nextText);
    };

    recognition.onerror = (event) => {
      console.error('Error en dictado por voz:', event.error, event.message);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldKeepListeningRef.current = false;
        setIsListening(false);
        toast.error('No se pudo usar el micrófono. Revisá los permisos del navegador.');
        return;
      }

      if (event.error === 'no-speech') {
        return;
      }

      toast.error('El dictado se interrumpió. Podés continuar hablando o escribir manualmente.');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setInterimTranscript('');

      if (shouldKeepListeningRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (shouldKeepListeningRef.current) {
            startSpeechRecognition();
          }
        }, 350);
        return;
      }

      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error('No se pudo iniciar el dictado:', error);
      shouldKeepListeningRef.current = false;
      setIsListening(false);
      toast.error('No se pudo iniciar el dictado. Probá nuevamente o escribí el texto.');
    }
  }, [buildSpeechRecognition, idioma]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      shouldKeepListeningRef.current = false;
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    shouldKeepListeningRef.current = true;
    toast.info('Dictado continuo activado. Podés hacer pausas y detenerlo cuando termines.');
    startSpeechRecognition();
  }, [isListening, startSpeechRecognition]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    const cleanMessage = mensajeSocio.trim();

    if (!cleanMessage) {
      setGuidanceMessage('Contale al asistente qué querés lograr antes de generar la rutina. Podés escribir o usar el micrófono.');
      toast.error('Primero contale al asistente qué querés lograr');
      return;
    }

    const missingFields: string[] = [];
    if (!detectedIntent.objetivoNombre) missingFields.push('objetivo');
    if (!detectedIntent.dias) missingFields.push('cantidad de días');

    if (missingFields.length > 0) {
      setGuidanceMessage(`Agregá en tu mensaje: ${missingFields.join(' y ')}. Ejemplo: “Quiero ganar masa muscular y entrenar 4 días por semana”.`);
      toast.info('Faltan algunos datos para interpretar bien tu pedido');
      return;
    }

    if (!reviewMode) {
      setReviewMode(true);
      setGuidanceMessage('Revisá el resumen interpretado. Si está correcto, presioná “Confirmar y generar rutina”. Si no, ajustá tu mensaje.');
      toast.info('Revisá el resumen antes de generar la rutina');
      return;
    }

    setLoading(true);

    try {
      const response = await generarRutinaConAsistente({
        objetivo: Number(objetivo),
        nivel: Number(nivel),
        dias,
        idioma,
        mensajeSocio,
        restricciones,
      });

      if (!response.ok || !response.data) {
        throw new Error(response.error || 'No se pudo generar la rutina');
      }

      setResult(response.data);
      setReviewMode(false);
      setGuidanceMessage('');
      toast.success('Rutina generada correctamente');
    } catch (error) {
      console.error('Error al generar rutina con asistente:', error);
      toast.error(error instanceof Error ? error.message : 'Error al generar rutina');
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Asistente de Rutinas' />

          <main className='flex-1 bg-muted/30 px-4 py-6 md:px-8'>
            <div className='mx-auto flex max-w-6xl flex-col gap-6'>
              <section className='rounded-3xl border bg-card p-6 shadow-sm'>
                <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                  <div className='space-y-3'>
                    <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'>
                      <Bot className='h-4 w-4' />
                      Asistente inteligente
                    </div>
                    <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                      Contale qué rutina necesitás
                    </h1>
                    <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
                      Escribí o dictá tu pedido con tus palabras. El asistente va a interpretar tu objetivo,
                      días disponibles, nivel, prioridades y restricciones antes de generar la rutina.
                    </p>
                    <div className='rounded-2xl border bg-background p-4 text-sm text-muted-foreground'>
                      <p className='font-medium text-foreground'>Ejemplo</p>
                      <p>
                        “Quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.”
                      </p>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type='button' variant='outline' className='w-full md:w-auto'>
                        <HelpCircle className='h-4 w-4' />
                        Ayuda
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
                      <DialogHeader>
                        <DialogTitle>Cómo pedir tu rutina</DialogTitle>
                        <DialogDescription>
                          Podés escribir como hablás. No hace falta usar palabras técnicas.
                        </DialogDescription>
                      </DialogHeader>

                      <div className='space-y-5 text-sm leading-6 text-muted-foreground'>
                        <section>
                          <h3 className='font-semibold text-foreground'>Qué conviene contar</h3>
                          <ul className='mt-2 list-disc space-y-1 pl-5'>
                            <li>Qué querés lograr: ganar masa muscular, bajar de peso, definir, fuerza o resistencia.</li>
                            <li>Cuántos días podés entrenar por semana.</li>
                            <li>Tu nivel aproximado: principiante, intermedio o avanzado.</li>
                            <li>Si querés priorizar algún grupo muscular.</li>
                            <li>Si tenés lesiones, molestias o algo que el asistente deba cuidar.</li>
                          </ul>
                        </section>

                        <section>
                          <h3 className='font-semibold text-foreground'>Objetivos posibles</h3>
                          <p className='mt-2'>
                            Podés pedir volumen, definición, bajar de peso, fuerza, resistencia o volver a entrenar de a poco.
                          </p>
                        </section>

                        <section>
                          <h3 className='font-semibold text-foreground'>Frecuencia muscular</h3>
                          <p className='mt-2'>
                            Si entrenás pocos días, normalmente se reparte el cuerpo completo o torso/pierna. Si entrenás 5 o 6 días,
                            se puede tocar cada grupo muscular una o dos veces por semana según tu objetivo y recuperación.
                          </p>
                        </section>

                        <section>
                          <h3 className='font-semibold text-foreground'>Ejemplos</h3>
                          <div className='mt-2 space-y-2 rounded-2xl bg-muted p-4'>
                            <p>“Quiero bajar de peso. Puedo entrenar 4 días por semana y soy principiante.”</p>
                            <p>“Quiero una rutina de fuerza de 5 días. Soy avanzado, pero tengo molestias lumbares.”</p>
                            <p>“Hace tiempo que no entreno y quiero volver de a poco. Puedo ir 3 veces por semana.”</p>
                          </div>
                        </section>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </section>

              <div className='grid gap-6 lg:grid-cols-[1.15fr_0.85fr]'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <MessageSquareText className='h-5 w-5 text-primary' />
                      Tu pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className='space-y-5' onSubmit={handleSubmit}>
                      {usuarioEsAdmin && (
                        <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'>
                          Estás ingresando como admin. Esta experiencia está orientada al socio logueado.
                        </div>
                      )}

                      <div className='space-y-2'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                          <Label htmlFor='mensaje'>Escribí o dictá tu pedido</Label>
                          <Button
                            type='button'
                            variant={isListening ? 'destructive' : 'outline'}
                            size='sm'
                            onClick={handleVoiceInput}
                            disabled={!speechSupported || loading}
                            title={speechSupported ? 'Dictar texto con el micrófono' : 'Dictado no disponible en este navegador'}
                          >
                            {isListening ? (
                              <>
                                <Square className='h-4 w-4' />
                                Detener dictado
                              </>
                            ) : speechSupported ? (
                              <>
                                <Mic className='h-4 w-4' />
                                Dictar con voz
                              </>
                            ) : (
                              <>
                                <MicOff className='h-4 w-4' />
                                Voz no disponible
                              </>
                            )}
                          </Button>
                        </div>
                        <textarea
                          id='mensaje'
                          className='min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                          placeholder='Ejemplo: quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.'
                          value={mensajeSocio}
                          maxLength={1200}
                          onChange={(event) => setMensajeSocio(event.target.value)}
                        />
                        <div className='flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
                          <span>
                            {isListening
                              ? 'Dictado continuo activo. Podés pausar al hablar; detenelo cuando termines.'
                              : 'Incluí objetivo y días para que el asistente pueda interpretar mejor tu rutina.'}
                          </span>
                          <span>{mensajeSocio.length}/1200</span>
                        </div>
                        {isListening && interimTranscript && (
                          <p className='rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary'>
                            Escuchando: {interimTranscript}
                          </p>
                        )}
                      </div>

                      <div className='grid gap-4 md:grid-cols-[1fr_180px]'>
                        <div className='space-y-2'>
                          <Label htmlFor='restricciones'>Algo que el asistente deba cuidar</Label>
                          <Input
                            id='restricciones'
                            placeholder='Ejemplo: lumbalgia, dolor de rodilla, evitar impacto, prefiero máquinas.'
                            value={restricciones}
                            maxLength={1200}
                            onChange={(event) => setRestricciones(event.target.value)}
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='idioma'>Idioma</Label>
                          <select
                            id='idioma'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            value={idioma}
                            onChange={(event) => setIdioma(event.target.value as 'es' | 'en')}
                          >
                            <option value='es'>Español</option>
                            <option value='en'>English</option>
                          </select>
                        </div>
                      </div>

                      {guidanceMessage && (
                        <div className='rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100'>
                          {guidanceMessage}
                        </div>
                      )}

                      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                        <Button type='submit' disabled={usuarioEsAdmin || loading || objetivos.length === 0 || niveles.length === 0}>
                          {loading ? (
                            <>
                              <Loader2 className='h-4 w-4 animate-spin' />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className='h-4 w-4' />
                              {usuarioEsAdmin
                                ? 'Disponible para socio'
                                : reviewMode
                                  ? 'Confirmar y generar rutina'
                                  : 'Revisar pedido'}
                            </>
                          )}
                        </Button>
                        <Button type='button' variant='outline' asChild>
                          <Link href='/dashboard/rutinas'>Ver mis rutinas</Link>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen interpretado</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3 text-sm'>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>Objetivo</p>
                        <p className='font-semibold'>{detectedIntent.objetivoNombre ?? objetivoSeleccionado}</p>
                      </div>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>Nivel</p>
                        <p className='font-semibold'>{detectedIntent.nivelNombre ?? `${nivelSeleccionado} por defecto`}</p>
                      </div>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>Frecuencia</p>
                        <p className='font-semibold'>{detectedIntent.dias ?? dias} días por semana</p>
                      </div>
                      {detectedIntent.prioridadesMusculares?.length ? (
                        <div className='rounded-2xl bg-muted p-4'>
                          <p className='text-muted-foreground'>Prioridades</p>
                          <p className='font-semibold'>{detectedIntent.prioridadesMusculares.join(', ')}</p>
                        </div>
                      ) : null}
                      {detectedIntent.restriccionesDetectadas?.length ? (
                        <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'>
                          <p className='font-semibold'>Cuidado detectado</p>
                          <p>{detectedIntent.restriccionesDetectadas.join(', ')}</p>
                        </div>
                      ) : null}
                      {reviewMode && (
                        <div className='rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-100'>
                          Revisá estos datos. Si están bien, confirmá para generar la rutina.
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {result && (
                    <Card className='border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-green-800 dark:text-green-200'>
                          <CheckCircle2 className='h-5 w-5' />
                          Rutina generada
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-4 text-sm text-green-900 dark:text-green-100'>
                        <p>{result.mensajeFinal}</p>
                        <div className='rounded-xl bg-background/80 p-3 text-muted-foreground'>
                          <p>{result.resumen}</p>
                        </div>
                        <Button asChild>
                          <Link href='/dashboard/rutinas'>Ir al menú Rutinas</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </main>

          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

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
import type { Nivel } from '@/interfaces/niveles.interface';
import type { Objetivo } from '@/interfaces/objetivo.interface';
import type { RagRutinasAssistantResponseData } from '@/interfaces/ragRutinasAssistant.interface';
import { getNiveles, getObjetivos } from '@/services/apiClient';
import { generarRutinaConAsistente } from '@/services/ragRutinasAssistantService';
import { useAuthStore } from '@/stores/authStore';
import { useI18n } from '@/i18n/I18nProvider';
import { translateCoreLevel, translateCoreMuscleGroup, translateCoreObjective } from '@/utils/coreSeedI18n';

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
  const directMatch = normalized.match(/(?:^|\D)([1-6])\s*(?:dias?|veces|entrenamientos?|days?|times?|workouts?)(?:\s+(?:por|per)\s+(?:semana|week))?(?:\D|$)/);

  if (directMatch?.[1]) {
    return Number(directMatch[1]);
  }

  const wordMap: Record<string, number> = {
    un: 1,
    una: 1,
    uno: 1,
    one: 1,
    dos: 2,
    two: 2,
    tres: 3,
    three: 3,
    cuatro: 4,
    four: 4,
    cinco: 5,
    five: 5,
    seis: 6,
    six: 6,
  };

  for (const [word, value] of Object.entries(wordMap)) {
    const pattern = new RegExp(
      `\\b${word}\\s+(dias?|veces|entrenamientos?|days?|times?|workouts?)(\\s+(por|per)\\s+(semana|week))?\\b`
    );
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
    ['Pecho', /\b(pecho|pectorales?|chest|pecs?)\b/],
    ['Espalda', /\b(espalda|dorsales?|back|lats?)\b/],
    ['Hombros', /\b(hombros?|deltoides?|shoulders?|delts?)\b/],
    ['Brazos', /\b(brazos?|arms?)\b/],
    ['Bíceps', /\b(biceps)\b/],
    ['Tríceps', /\b(triceps)\b/],
    ['Piernas', /\b(piernas?|cuadriceps|isquios?|legs?|quads?|hamstrings?)\b/],
    ['Glúteos', /\b(gluteos?|glutes?)\b/],
    ['Abdominales', /\b(abdominales?|abs?|core|zona media|midsection)\b/],
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
  const { locale } = useI18n();
  const tx = useCallback((es: string, en: string) => (locale === 'en' ? en : es), [locale]);

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [objetivo, setObjetivo] = useState<string>('1');
  const [nivel, setNivel] = useState<string>('1');
  const [dias, setDias] = useState<number>(3);
  const [idioma, setIdioma] = useState<'es' | 'en'>(locale === 'en' ? 'en' : 'es');
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
    setIdioma(locale === 'en' ? 'en' : 'es');
  }, [locale]);

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
      toast.error(tx('No se pudieron cargar objetivos y niveles', 'Goals and levels could not be loaded'));
    }
  }, [token, tx]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && token) {
      cargarCatalogos();
    }
  }, [cargarCatalogos, isAuthenticated, isInitialized, token]);

  const objetivoSeleccionado = useMemo(
    () => translateCoreObjective(
      objetivos.find((item) => String(item.id_objetivo) === objetivo)?.nombre_objetivo,
      locale,
    ) || tx(`Objetivo ${objetivo}`, `Goal ${objetivo}`),
    [locale, objetivo, objetivos, tx]
  );

  const nivelSeleccionado = useMemo(
    () => translateCoreLevel(
      niveles.find((item) => String(item.id_nivel) === nivel)?.nombre_nivel,
      locale,
    ) || tx(`Nivel ${nivel}`, `Level ${nivel}`),
    [locale, nivel, niveles, tx]
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

    if (/(volumen|hipertrofia|masa muscular|ganar masa|aumentar masa|crear musculo|ganar musculo|gain muscle|muscle gain|hypertrophy|bulk|bulking)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['volumen']);
    } else if (/(definicion|definir|marcar|marcado|definition|define|cut|cutting|lean)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['definicion']);
    } else if (/(bajar de peso|perder peso|adelgazar|bajar grasa|perder grasa|descenso de grasa|lose weight|weight loss|lose fat|fat loss)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['bajar de peso']);
    } else if (/(fuerza|mas fuerte|aumentar fuerza|strength|stronger|increase strength)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['aumentar fuerza', 'fuerza']);
    } else if (/(resistencia|aguante|cardio|capacidad aerobica|endurance|stamina|aerobic capacity)/.test(normalized)) {
      detectedObjective = findCatalogItemByKeywords(objetivos, (item) => item.nombre_objetivo, ['mejorar resistencia', 'resistencia']);
    }

    if (detectedObjective?.id_objetivo && String(detectedObjective.id_objetivo) !== objetivo) {
      setObjetivo(String(detectedObjective.id_objetivo));
      nextIntent.objetivoNombre = detectedObjective.nombre_objetivo;
    } else if (detectedObjective?.nombre_objetivo) {
      nextIntent.objetivoNombre = detectedObjective.nombre_objetivo;
    }

    let detectedLevel: Nivel | undefined;

    if (/(inicial|principiante|empiezo|recien empiezo|nuevo|beginner|starting|new to training)/.test(normalized)) {
      detectedLevel = findCatalogItemByKeywords(niveles, (item) => item.nombre_nivel, ['inicial']);
    } else if (/(intermedio|hace rato|algo de experiencia|intermediate|some experience)/.test(normalized)) {
      detectedLevel = findCatalogItemByKeywords(niveles, (item) => item.nombre_nivel, ['intermedio']);
    } else if (/(avanzado|experto|muchos anos|mucha experiencia|advanced|expert|experienced)/.test(normalized)) {
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

    if (/(lumbalgia|dolor lumbar|zona lumbar|hernia|ciatica|ciatico|lower back pain|low back pain|sciatica|herniated disc)/.test(normalized)) {
      const lumbarRestriction = idioma === 'en'
        ? 'Reported lower-back pain: avoid high-risk lumbar exercises and prioritize controlled variations.'
        : 'Lumbalgia/dolor lumbar informado: evitar ejercicios de alto riesgo lumbar y priorizar variantes controladas.';
      setRestricciones((current) => appendUniqueRestriction(current, lumbarRestriction));
      detectedRestrictions.push(tx('lumbalgia/dolor lumbar', 'lower-back pain'));
    }

    if (/(lesion|lesionado|dolor|molestia|injury|injured|pain|discomfort)/.test(normalized) && detectedRestrictions.length === 0) {
      detectedRestrictions.push(tx('posible restricción física', 'possible physical restriction'));
    }

    if (detectedRestrictions.length > 0) {
      nextIntent.restriccionesDetectadas = detectedRestrictions;
    }

    setDetectedIntent(nextIntent);
  }, [dias, idioma, nivel, niveles, objetivo, objetivos, tx]);

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
      toast.error(tx('Tu navegador no soporta dictado por voz. Podés escribir el texto manualmente.', 'Your browser does not support voice dictation. You can type the text manually.'));
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
        toast.error(tx('No se pudo usar el micrófono. Revisá los permisos del navegador.', 'The microphone could not be used. Check your browser permissions.'));
        return;
      }

      if (event.error === 'no-speech') {
        return;
      }

      toast.error(tx('El dictado se interrumpió. Podés continuar hablando o escribir manualmente.', 'Dictation was interrupted. You can continue speaking or type manually.'));
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
      toast.error(tx('No se pudo iniciar el dictado. Probá nuevamente o escribí el texto.', 'Dictation could not be started. Try again or type the text.'));
    }
  }, [buildSpeechRecognition, idioma, tx]);

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
    toast.info(tx('Dictado continuo activado. Podés hacer pausas y detenerlo cuando termines.', 'Continuous dictation enabled. You can pause while speaking and stop it when finished.'));
    startSpeechRecognition();
  }, [isListening, startSpeechRecognition, tx]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    const cleanMessage = mensajeSocio.trim();

    if (!cleanMessage) {
      setGuidanceMessage(tx('Contale al asistente qué querés lograr antes de generar la rutina. Podés escribir o usar el micrófono.', 'Tell the assistant what you want to achieve before generating the routine. You can type or use the microphone.'));
      toast.error(tx('Primero contale al asistente qué querés lograr', 'First tell the assistant what you want to achieve'));
      return;
    }

    const missingFields: string[] = [];
    if (!detectedIntent.objetivoNombre) missingFields.push(tx('objetivo', 'goal'));
    if (!detectedIntent.dias) missingFields.push(tx('cantidad de días', 'number of days'));

    if (missingFields.length > 0) {
      setGuidanceMessage(tx(`Agregá en tu mensaje: ${missingFields.join(' y ')}. Ejemplo: “Quiero ganar masa muscular y entrenar 4 días por semana”.`, `Add this to your message: ${missingFields.join(' and ')}. Example: “I want to gain muscle and train 4 days per week.”`));
      toast.info(tx('Faltan algunos datos para interpretar bien tu pedido', 'Some information is missing to interpret your request correctly'));
      return;
    }

    if (!reviewMode) {
      setReviewMode(true);
      setGuidanceMessage(tx('Revisá el resumen interpretado. Si está correcto, presioná “Confirmar y generar rutina”. Si no, ajustá tu mensaje.', 'Review the interpreted summary. If it is correct, press “Confirm and generate routine”. Otherwise, adjust your message.'));
      toast.info(tx('Revisá el resumen antes de generar la rutina', 'Review the summary before generating the routine'));
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
        throw new Error(response.error || tx('No se pudo generar la rutina', 'The routine could not be generated'));
      }

      setResult(response.data);
      setReviewMode(false);
      setGuidanceMessage('');
      toast.success(tx('Rutina generada correctamente', 'Routine generated successfully'));
    } catch (error) {
      console.error('Error al generar rutina con asistente:', error);
      toast.error(error instanceof Error ? error.message : tx('Error al generar rutina', 'Error generating routine'));
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return <div>{tx('Cargando...', 'Loading...')}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx('Asistente de Rutinas', 'Routine Assistant')} />

          <main className='flex-1 bg-muted/30 px-4 py-6 md:px-8'>
            <div className='mx-auto flex max-w-6xl flex-col gap-6'>
              <section className='rounded-3xl border bg-card p-6 shadow-sm'>
                <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                  <div className='space-y-3'>
                    <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'>
                      <Bot className='h-4 w-4' />
                      {tx('Asistente inteligente', 'Smart assistant')}
                    </div>
                    <h1 className='text-3xl font-bold tracking-tight text-foreground'>
                      {tx('Contale qué rutina necesitás', 'Describe the routine you need')}
                    </h1>
                    <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
                      {tx(
                        'Escribí o dictá tu pedido con tus palabras. El asistente va a interpretar tu objetivo, días disponibles, nivel, prioridades y restricciones antes de generar la rutina.',
                        'Type or dictate your request in your own words. The assistant will interpret your goal, available days, level, priorities, and restrictions before generating the routine.',
                      )}
                    </p>
                    <div className='rounded-2xl border bg-background p-4 text-sm text-muted-foreground'>
                      <p className='font-medium text-foreground'>{tx('Ejemplo', 'Example')}</p>
                      <p>
                        {tx(
                          '“Quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.”',
                          '“I want to gain muscle, train 6 days, and prioritize back and shoulders. I am intermediate and have lower-back pain.”',
                        )}
                      </p>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type='button' variant='outline' className='w-full md:w-auto'>
                        <HelpCircle className='h-4 w-4' />
                        {tx('Ayuda', 'Help')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
                      <DialogHeader>
                        <DialogTitle>{tx('Cómo pedir tu rutina', 'How to request your routine')}</DialogTitle>
                        <DialogDescription>
                          {tx('Podés escribir como hablás. No hace falta usar palabras técnicas.', 'You can write naturally. Technical terms are not required.')}
                        </DialogDescription>
                      </DialogHeader>

                      <div className='space-y-5 text-sm leading-6 text-muted-foreground'>
                        <section>
                          <h3 className='font-semibold text-foreground'>{tx('Qué conviene contar', 'What to include')}</h3>
                          <ul className='mt-2 list-disc space-y-1 pl-5'>
                            <li>{tx('Qué querés lograr: ganar masa muscular, bajar de peso, definir, fuerza o resistencia.', 'What you want to achieve: gain muscle, lose weight, define, build strength, or improve endurance.')}</li>
                            <li>{tx('Cuántos días podés entrenar por semana.', 'How many days you can train per week.')}</li>
                            <li>{tx('Tu nivel aproximado: principiante, intermedio o avanzado.', 'Your approximate level: beginner, intermediate, or advanced.')}</li>
                            <li>{tx('Si querés priorizar algún grupo muscular.', 'Whether you want to prioritize a muscle group.')}</li>
                            <li>{tx('Si tenés lesiones, molestias o algo que el asistente deba cuidar.', 'Any injuries, discomfort, or conditions the assistant should consider.')}</li>
                          </ul>
                        </section>

                        <section>
                          <h3 className='font-semibold text-foreground'>{tx('Objetivos posibles', 'Possible goals')}</h3>
                          <p className='mt-2'>
                            {tx('Podés pedir volumen, definición, bajar de peso, fuerza, resistencia o volver a entrenar de a poco.', 'You can request muscle gain, definition, weight loss, strength, endurance, or a gradual return to training.')}
                          </p>
                        </section>

                        <section>
                          <h3 className='font-semibold text-foreground'>{tx('Frecuencia muscular', 'Muscle frequency')}</h3>
                          <p className='mt-2'>
                            {tx(
                              'Si entrenás pocos días, normalmente se reparte el cuerpo completo o torso/pierna. Si entrenás 5 o 6 días, se puede trabajar cada grupo muscular una o dos veces por semana según tu objetivo y recuperación.',
                              'With fewer training days, full-body or upper/lower splits are usually used. With 5 or 6 days, each muscle group can be trained once or twice per week depending on your goal and recovery.',
                            )}
                          </p>
                        </section>

                        <section>
                          <h3 className='font-semibold text-foreground'>{tx('Ejemplos', 'Examples')}</h3>
                          <div className='mt-2 space-y-2 rounded-2xl bg-muted p-4'>
                            <p>{tx('“Quiero bajar de peso. Puedo entrenar 4 días por semana y soy principiante.”', '“I want to lose weight. I can train 4 days per week and I am a beginner.”')}</p>
                            <p>{tx('“Quiero una rutina de fuerza de 5 días. Soy avanzado, pero tengo molestias lumbares.”', '“I want a 5-day strength routine. I am advanced, but I have lower-back discomfort.”')}</p>
                            <p>{tx('“Hace tiempo que no entreno y quiero volver de a poco. Puedo ir 3 veces por semana.”', '“I have not trained for a while and want to return gradually. I can go 3 times per week.”')}</p>
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
                      {tx('Tu pedido', 'Your request')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className='space-y-5' onSubmit={handleSubmit}>
                      {usuarioEsAdmin && (
                        <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'>
                          {tx('Estás ingresando como admin. Esta experiencia está orientada al socio logueado.', 'You are signed in as an administrator. This experience is intended for the signed-in member.')}
                        </div>
                      )}

                      <div className='space-y-2'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                          <Label htmlFor='mensaje'>{tx('Escribí o dictá tu pedido', 'Type or dictate your request')}</Label>
                          <Button
                            type='button'
                            variant={isListening ? 'destructive' : 'outline'}
                            size='sm'
                            onClick={handleVoiceInput}
                            disabled={!speechSupported || loading}
                            title={speechSupported ? tx('Dictar texto con el micrófono', 'Dictate text with the microphone') : tx('Dictado no disponible en este navegador', 'Dictation is not available in this browser')}
                          >
                            {isListening ? (
                              <>
                                <Square className='h-4 w-4' />
                                {tx('Detener dictado', 'Stop dictation')}
                              </>
                            ) : speechSupported ? (
                              <>
                                <Mic className='h-4 w-4' />
                                {tx('Dictar con voz', 'Dictate by voice')}
                              </>
                            ) : (
                              <>
                                <MicOff className='h-4 w-4' />
                                {tx('Voz no disponible', 'Voice unavailable')}
                              </>
                            )}
                          </Button>
                        </div>
                        <textarea
                          id='mensaje'
                          className='min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                          placeholder={tx('Ejemplo: quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.', 'Example: I want to gain muscle, train 6 days, and prioritize back and shoulders. I am intermediate and have lower-back pain.')}
                          value={mensajeSocio}
                          maxLength={1200}
                          onChange={(event) => setMensajeSocio(event.target.value)}
                        />
                        <div className='flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
                          <span>
                            {isListening
                              ? tx('Dictado continuo activo. Podés pausar al hablar; detenelo cuando termines.', 'Continuous dictation is active. You can pause while speaking; stop it when finished.')
                              : tx('Incluí objetivo y días para que el asistente pueda interpretar mejor tu rutina.', 'Include your goal and training days so the assistant can interpret your routine more accurately.')}
                          </span>
                          <span>{mensajeSocio.length}/1200</span>
                        </div>
                        {isListening && interimTranscript && (
                          <p className='rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary'>
                            {tx('Escuchando:', 'Listening:')} {interimTranscript}
                          </p>
                        )}
                      </div>

                      <div className='grid gap-4 md:grid-cols-[1fr_180px]'>
                        <div className='space-y-2'>
                          <Label htmlFor='restricciones'>{tx('Algo que el asistente deba cuidar', 'Something the assistant should consider')}</Label>
                          <Input
                            id='restricciones'
                            placeholder={tx('Ejemplo: lumbalgia, dolor de rodilla, evitar impacto, prefiero máquinas.', 'Example: lower-back pain, knee pain, avoid impact, I prefer machines.')}
                            value={restricciones}
                            maxLength={1200}
                            onChange={(event) => setRestricciones(event.target.value)}
                          />
                        </div>

                        <div className='space-y-2'>
                          <Label htmlFor='idioma'>{tx('Idioma de salida', 'Output language')}</Label>
                          <select
                            id='idioma'
                            className='h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            value={idioma}
                            onChange={(event) => setIdioma(event.target.value as 'es' | 'en')}
                          >
                            <option value='es'>{tx('Español', 'Spanish')}</option>
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
                              {tx('Generando...', 'Generating...')}
                            </>
                          ) : (
                            <>
                              <Sparkles className='h-4 w-4' />
                              {usuarioEsAdmin
                                ? tx('Disponible para socio', 'Available for members')
                                : reviewMode
                                  ? tx('Confirmar y generar rutina', 'Confirm and generate routine')
                                  : tx('Revisar pedido', 'Review request')}
                            </>
                          )}
                        </Button>
                        <Button type='button' variant='outline' asChild>
                          <Link href='/dashboard/rutinas'>{tx('Ver mis rutinas', 'View my routines')}</Link>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className='space-y-6'>
                  <Card>
                    <CardHeader>
                      <CardTitle>{tx('Resumen interpretado', 'Interpreted summary')}</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3 text-sm'>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>{tx('Objetivo', 'Goal')}</p>
                        <p className='font-semibold'>{translateCoreObjective(detectedIntent.objetivoNombre, locale) || objetivoSeleccionado}</p>
                      </div>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>{tx('Nivel', 'Level')}</p>
                        <p className='font-semibold'>{detectedIntent.nivelNombre ? translateCoreLevel(detectedIntent.nivelNombre, locale) : tx(`${nivelSeleccionado} por defecto`, `${nivelSeleccionado} by default`)}</p>
                      </div>
                      <div className='rounded-2xl bg-muted p-4'>
                        <p className='text-muted-foreground'>{tx('Frecuencia', 'Frequency')}</p>
                        <p className='font-semibold'>{detectedIntent.dias ?? dias} {tx('días por semana', 'days per week')}</p>
                      </div>
                      {detectedIntent.prioridadesMusculares?.length ? (
                        <div className='rounded-2xl bg-muted p-4'>
                          <p className='text-muted-foreground'>{tx('Prioridades', 'Priorities')}</p>
                          <p className='font-semibold'>{detectedIntent.prioridadesMusculares.map((item) => translateCoreMuscleGroup(item, locale)).join(', ')}</p>
                        </div>
                      ) : null}
                      {detectedIntent.restriccionesDetectadas?.length ? (
                        <div className='rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'>
                          <p className='font-semibold'>{tx('Cuidado detectado', 'Detected consideration')}</p>
                          <p>{detectedIntent.restriccionesDetectadas.join(', ')}</p>
                        </div>
                      ) : null}
                      {reviewMode && (
                        <div className='rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-100'>
                          {tx('Revisá estos datos. Si están bien, confirmá para generar la rutina.', 'Review this information. If it is correct, confirm to generate the routine.')}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {result && (
                    <Card className='border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20'>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-green-800 dark:text-green-200'>
                          <CheckCircle2 className='h-5 w-5' />
                          {tx('Rutina generada', 'Routine generated')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-4 text-sm text-green-900 dark:text-green-100'>
                        <p>{result.mensajeFinal}</p>
                        <div className='rounded-xl bg-background/80 p-3 text-muted-foreground'>
                          <p>{result.resumen}</p>
                        </div>

                        {result.ragContext?.used && result.ragContext.results.length > 0 && (
                          <div className='rounded-xl bg-background/80 p-3 text-muted-foreground'>
                            <p className='font-semibold text-foreground'>{tx('Conocimiento RAG aplicado', 'Applied RAG knowledge')}</p>
                            <p className='mt-1'>
                              {tx('Se recuperaron', 'Retrieved')} {result.ragContext.results.length} {tx('referencias de ejercicios reales para orientar la rutina.', 'real exercise references to guide the routine.')}
                            </p>
                            <ul className='mt-2 list-disc space-y-1 pl-5'>
                              {result.ragContext.results.slice(0, 5).map((source) => (
                                <li key={source.chunkId}>
                                  <span className='font-medium text-foreground'>{source.title}</span>
                                  <span> · {tx('puntaje', 'score')} {source.similarity.toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.advertencias.length > 0 && (
                          <div className='rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100'>
                            <p className='font-semibold'>{tx('Advertencias técnicas', 'Technical warnings')}</p>
                            <ul className='mt-2 list-disc space-y-1 pl-5'>
                              {result.advertencias.map((warning) => (
                                <li key={warning}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <Button asChild>
                          <Link href='/dashboard/rutinas'>{tx('Ir al menú Rutinas', 'Go to Routines menu')}</Link>
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

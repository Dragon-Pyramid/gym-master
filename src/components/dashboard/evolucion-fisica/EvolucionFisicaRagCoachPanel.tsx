"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { analizarEvolucionFisicaConRag } from "@/services/evolucionSocioClient";
import type { RagEvolucionFisicaAssistantResponseData } from "@/interfaces/ragEvolucionFisicaAssistant.interface";

const formatDelta = (value?: number | null, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const n = Number(value);
  return `${n > 0 ? "+" : ""}${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}${suffix}`;
};

export default function EvolucionFisicaRagCoachPanel({
  socioId,
  socioNombre,
}: {
  socioId: string;
  socioNombre: string;
}) {
  const [objetivo, setObjetivo] = useState("");
  const [mensajeSocio, setMensajeSocio] = useState("");
  const [restricciones, setRestricciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RagEvolucionFisicaAssistantResponseData | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await analizarEvolucionFisicaConRag({
        socio_id: socioId,
        idioma: "es",
        objetivo,
        mensajeSocio,
        restricciones,
      });

      setResult(res.data as RagEvolucionFisicaAssistantResponseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo analizar la evolución física.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full rounded-2xl border bg-white shadow-sm">
      <CardHeader className="space-y-1 border-b p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#02a8e1]" />
              <h2 className="text-xl font-bold text-gray-950">RAG Coach evolución física</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Analiza el progreso de {socioNombre} y sugiere ajustes prudentes sin reemplazar criterio profesional.
            </p>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-[#02a8e1] hover:bg-[#0288b1]"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? "Analizando..." : "Analizar con IA"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="rag-evolucion-objetivo">Objetivo actual</Label>
            <textarea
              id="rag-evolucion-objetivo"
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ejemplo: bajar grasa, ganar masa muscular, recomposición corporal."
              value={objetivo}
              maxLength={1200}
              onChange={(e) => setObjetivo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="rag-evolucion-mensaje">Pedido o consulta</Label>
            <textarea
              id="rag-evolucion-mensaje"
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ejemplo: quiero saber si voy bien y qué debería ajustar esta semana."
              value={mensajeSocio}
              maxLength={1200}
              onChange={(e) => setMensajeSocio(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="rag-evolucion-restricciones">Restricciones o cuidados</Label>
            <textarea
              id="rag-evolucion-restricciones"
              className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ejemplo: dolor de rodilla, lesión, hipertensión, fatiga."
              value={restricciones}
              maxLength={1200}
              onChange={(e) => setRestricciones(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4 rounded-md border bg-muted/40 p-4 text-sm">
            <div>
              <p className="font-semibold">Resumen del RAG Coach</p>
              <p className="mt-1 text-muted-foreground">{result.resumen}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Modo: {result.modo} · Registros analizados: {result.progreso.totalRegistros}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="rounded-md border bg-white p-3">
                <p className="text-xs text-muted-foreground">Peso</p>
                <p className="font-semibold">{formatDelta(result.progreso.peso.diferencia, " kg")}</p>
              </div>
              <div className="rounded-md border bg-white p-3">
                <p className="text-xs text-muted-foreground">Cintura</p>
                <p className="font-semibold">{formatDelta(result.progreso.cintura.diferencia, " cm")}</p>
              </div>
              <div className="rounded-md border bg-white p-3">
                <p className="text-xs text-muted-foreground">IMC</p>
                <p className="font-semibold">{formatDelta(result.progreso.imc.diferencia)}</p>
              </div>
              <div className="rounded-md border bg-white p-3">
                <p className="text-xs text-muted-foreground">% grasa</p>
                <p className="font-semibold">{formatDelta(result.progreso.porcentajeGrasa.diferencia, "%")}</p>
              </div>
              <div className="rounded-md border bg-white p-3">
                <p className="text-xs text-muted-foreground">Masa muscular</p>
                <p className="font-semibold">{formatDelta(result.progreso.masaMuscular.diferencia, " kg")}</p>
              </div>
            </div>

            {result.recomendaciones.length > 0 && (
              <div>
                <p className="font-semibold">Recomendaciones prudentes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.recomendaciones.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.ragContext?.used && result.ragContext.results.length > 0 && (
              <div>
                <p className="font-semibold">Referencias RAG aplicadas</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.ragContext.results.slice(0, 5).map((source) => (
                    <li key={source.chunkId}>
                      <span className="font-medium text-foreground">{source.title}</span>
                      <span> · {source.domain} · score {source.similarity.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.alertas.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="font-semibold">Alertas / cuidados</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {result.alertas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.disclaimers.length > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900">
                <p className="font-semibold">Disclaimer de salud</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {result.disclaimers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

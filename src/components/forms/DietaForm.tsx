"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { CreateDietaDto, Dieta } from "@/interfaces/dieta.interface";
import {
  generarDietaConAsistente,
  getObjetivos,
} from "@/services/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "@/i18n/I18nProvider";
import { translateDietGoal } from "@/utils/dietaI18nPresentation";

import type { Objetivo } from "@/interfaces/objetivo.interface";
import type { RagDietasAssistantResponseData } from "@/interfaces/ragDietasAssistant.interface";

interface DietaFormProps {
  initialSocioId?: string;
  socioNombre?: string;
  onSuccess?: (dieta: Dieta) => void;
  submitLabel?: string;
}

export default function DietaForm({
  initialSocioId,
  socioNombre,
  onSuccess,
  submitLabel = "Generar dieta",
}: DietaFormProps) {
  const [objetivo, setObjetivo] = useState<CreateDietaDto["objetivo"]>("");
  const [fechaInicio, setFechaInicio] =
    useState<CreateDietaDto["fecha_inicio"]>("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fechaFin, setFechaFin] = useState<CreateDietaDto["fecha_fin"]>("");
  const [mensajeSocio, setMensajeSocio] = useState("");
  const [restricciones, setRestricciones] = useState("");
  const [preferencias, setPreferencias] = useState("");
  const [assistantResult, setAssistantResult] = useState<RagDietasAssistantResponseData | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const { user } = useAuthStore();
  const { locale } = useI18n();
  const isEnglish = locale === "en";
  const tx = (es: string, en: string) => (isEnglish ? en : es);

  useEffect(() => {
    getObjetivos().then((res) => {
      if (res.ok && Array.isArray(res.data)) setObjetivos(res.data);
    });
  }, []);

  const resolveSocioId = async () => {
    if (initialSocioId) return initialSocioId;
    if (user?.id_socio) return user.id_socio.toString();
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMessage(null);
    setAssistantResult(null);

    try {
      const socioId = await resolveSocioId();
      if (!socioId) {
        setErrorMessage(tx("No se pudo identificar el socio para generar la dieta.", "The member could not be identified to generate the diet."));
        return;
      }

      const body = {
        socio_id: socioId,
        objetivo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        idioma: locale,
        mensajeSocio,
        restricciones,
        preferencias,
      };

      const res = await generarDietaConAsistente(body);
      if (!res.ok) {
        setErrorMessage(
          res.data?.error || res.data?.message || tx("No se pudo generar la dieta.", "The diet could not be generated.")
        );
        return;
      }

      const result = res.data?.data as RagDietasAssistantResponseData | undefined;
      const dietaGenerada = result?.dietaGenerada ?? res.data;

      setAssistantResult(result ?? null);
      setMessage(result?.mensajeFinal || tx("Dieta generada correctamente.", "Diet generated successfully."));
      if (dietaGenerada && onSuccess) {
        onSuccess(dietaGenerada as Dieta);
      }
    } catch (error) {
      console.error("Error al generar dieta:", error);
      setErrorMessage(tx("Ocurrió un error al generar la dieta.", "An error occurred while generating the diet."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/DietaForm.tsx" />
      {socioNombre && (
        <div className="p-3 border rounded-md col-span-full bg-muted/40">
          <p className="text-xs text-muted-foreground">{tx("Socio seleccionado", "Selected member")}</p>
          <p className="text-sm font-semibold">{socioNombre}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="objetivo">{tx("Objetivo nutricional", "Nutritional goal")}</Label>
        <select
          id="objetivo"
          name="objetivo"
          className="h-10 px-3 py-2 text-sm border rounded-md"
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          required
        >
          <option value="">{tx("Seleccione objetivo", "Select goal")}</option>
          {objetivos.map((opt) => (
            <option key={opt.id_objetivo} value={opt.id_objetivo}>
              {translateDietGoal(opt.nombre_objetivo, isEnglish)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_inicio">{tx("Fecha inicio", "Start date")}</Label>
        <Input
          id="fecha_inicio"
          name="fecha_inicio"
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_fin">{tx("Fecha fin", "End date")}</Label>
        <Input
          id="fecha_fin"
          name="fecha_fin"
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5 col-span-full">
        <Label htmlFor="mensajeSocio">{tx("Pedido u objetivo del socio", "Member request or goal")}</Label>
        <textarea
          id="mensajeSocio"
          className="min-h-24 rounded-md border px-3 py-2 text-sm"
          placeholder={tx("Ejemplo: quiero bajar grasa sin perder músculo, entreno 3 días y necesito comidas simples.", "Example: I want to lose fat without losing muscle, I train 3 days and need simple meals.")}
          value={mensajeSocio}
          maxLength={1200}
          onChange={(e) => setMensajeSocio(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5 col-span-full md:col-span-1">
        <Label htmlFor="restricciones">{tx("Restricciones o cuidados", "Restrictions or precautions")}</Label>
        <textarea
          id="restricciones"
          className="min-h-24 rounded-md border px-3 py-2 text-sm"
          placeholder={tx("Ejemplo: hipertensión, diabetes, alergias, intolerancias, medicación, embarazo.", "Example: hypertension, diabetes, allergies, intolerances, medication, pregnancy.")}
          value={restricciones}
          maxLength={1200}
          onChange={(e) => setRestricciones(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5 col-span-full md:col-span-1">
        <Label htmlFor="preferencias">{tx("Preferencias alimentarias", "Food preferences")}</Label>
        <textarea
          id="preferencias"
          className="min-h-24 rounded-md border px-3 py-2 text-sm"
          placeholder={tx("Ejemplo: prefiero pollo, arroz, verduras, sin lactosa, económico y fácil de preparar.", "Example: I prefer chicken, rice, vegetables, lactose-free, affordable and easy to prepare.")}
          value={preferencias}
          maxLength={1200}
          onChange={(e) => setPreferencias(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        className="col-span-full justify-self-end"
        disabled={loading}
      >
        {loading ? tx("Generando...", "Generating...") : isEnglish && submitLabel === "Generar dieta" ? "Generate diet" : submitLabel}
      </Button>

      {message && (
        <div className="p-3 text-sm text-green-700 border border-green-200 rounded-md col-span-full bg-green-50">
          {message}
        </div>
      )}

      {assistantResult && (
        <div className="space-y-3 rounded-md border bg-muted/40 p-4 text-sm col-span-full">
          <div>
            <p className="font-semibold">{tx("Resumen RAG Coach", "RAG Coach summary")}</p>
            <p className="text-muted-foreground">{assistantResult.resumen}</p>
          </div>

          {assistantResult.ragContext?.used && assistantResult.ragContext.results.length > 0 && (
            <div>
              <p className="font-semibold">{tx("Referencias nutricionales aplicadas", "Applied nutrition references")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {assistantResult.ragContext.results.slice(0, 5).map((source) => (
                  <li key={source.chunkId}>
                    <span className="font-medium text-foreground">{source.title}</span>
                    <span> · score {source.similarity.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {assistantResult.disclaimers.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <p className="font-semibold">{tx("Aviso nutricional", "Nutrition notice")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {assistantResult.disclaimers.map((disclaimer) => (
                  <li key={disclaimer}>{disclaimer}</li>
                ))}
              </ul>
            </div>
          )}

          {assistantResult.advertencias.length > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900">
              <p className="font-semibold">{tx("Advertencias técnicas / seguridad", "Technical / safety warnings")}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {assistantResult.advertencias.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 text-sm text-red-700 border border-red-200 rounded-md col-span-full bg-red-50">
          {errorMessage}
        </div>
      )}
    </form>
  );
}

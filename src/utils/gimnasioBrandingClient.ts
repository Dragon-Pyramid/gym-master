"use client";

import type { GimnasioParametrizacion } from "@/interfaces/gimnasioParametrizacion.interface";
import { getGimnasioParametrizacion } from "@/services/gimnasioParametrizacionService";
import {
  buildGimnasioParametrizacionRequiredMessage,
  getMissingGimnasioParametrizacionFields,
} from "@/utils/gimnasioParametrizacionRequired";

export interface ResolvedGimnasioBranding {
  data: GimnasioParametrizacion | null;
  nombre: string;
  subtitulo: string;
  logoUrl: string;
  textoLegalRecibos: string;
  textoLegalReportes: string;
  piePagina: string;
  parametrizacionCompleta: boolean;
  camposFaltantes: string[];
}

const DEFAULT_LOGO = "/gm_logo.svg";
const DEFAULT_NAME = "Gym Master";
const DEFAULT_SUBTITLE = "Dragon Pyramid · Gestión integral de gimnasios";
const DEFAULT_FOOTER = "Gym Master · Documento generado por el sistema";

function compactJoin(values: Array<string | null | undefined>) {
  return values.map((value) => value?.trim()).filter(Boolean).join(" · ");
}

export async function getResolvedGimnasioBranding(): Promise<ResolvedGimnasioBranding> {
  try {
    const data = await getGimnasioParametrizacion();
    const nombre = data.nombre_comercial?.trim() || DEFAULT_NAME;
    const fiscal = compactJoin([
      data.razon_social,
      data.identificacion_fiscal ? `CUIT/DNI ${data.identificacion_fiscal}` : null,
      data.condicion_fiscal,
    ]);

    const camposFaltantes = getMissingGimnasioParametrizacionFields(data);

    return {
      data,
      nombre,
      subtitulo: fiscal || DEFAULT_SUBTITLE,
      logoUrl: data.logo_url?.trim() || DEFAULT_LOGO,
      textoLegalRecibos: data.texto_legal_recibos?.trim() || "",
      textoLegalReportes: data.texto_legal_reportes?.trim() || "",
      piePagina: data.pie_pagina_documentos?.trim() || DEFAULT_FOOTER,
      parametrizacionCompleta: camposFaltantes.length === 0,
      camposFaltantes,
    };
  } catch {
    return {
      data: null,
      nombre: DEFAULT_NAME,
      subtitulo: DEFAULT_SUBTITLE,
      logoUrl: DEFAULT_LOGO,
      textoLegalRecibos: "",
      textoLegalReportes: "",
      piePagina: DEFAULT_FOOTER,
      parametrizacionCompleta: false,
      camposFaltantes: getMissingGimnasioParametrizacionFields(null),
    };
  }
}

export function assertGimnasioBrandingReadyForCommercialDocs(branding: ResolvedGimnasioBranding): void {
  if (branding.parametrizacionCompleta) return;

  const message = buildGimnasioParametrizacionRequiredMessage(branding.camposFaltantes);

  if (typeof window !== 'undefined') {
    window.alert(message);
  }

  throw new Error(message);
}

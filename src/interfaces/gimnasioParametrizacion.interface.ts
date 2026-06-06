export interface GimnasioParametrizacion {
  id: string;
  singleton_key: 'principal';
  nombre_comercial: string;
  razon_social: string | null;
  identificacion_fiscal: string | null;
  condicion_fiscal: string | null;
  domicilio_legal: string | null;
  ciudad: string | null;
  provincia: string | null;
  pais: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  logo_url: string | null;
  logo_alternativo_url: string | null;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  texto_legal_recibos: string | null;
  texto_legal_reportes: string | null;
  pie_pagina_documentos: string | null;
  stripe_habilitado: boolean;
  stripe_estado: 'no_configurado' | 'configurado' | 'activo' | 'inactivo' | string;
  stripe_modo: 'test' | 'live' | string;
  stripe_public_key: string | null;
  stripe_account_reference: string | null;
  stripe_observaciones: string | null;
  activo: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
  actualizado_por: string | null;
}

export type GimnasioParametrizacionPayload = Partial<
  Pick<
    GimnasioParametrizacion,
    | 'nombre_comercial'
    | 'razon_social'
    | 'identificacion_fiscal'
    | 'condicion_fiscal'
    | 'domicilio_legal'
    | 'ciudad'
    | 'provincia'
    | 'pais'
    | 'telefono'
    | 'email'
    | 'sitio_web'
    | 'instagram_url'
    | 'facebook_url'
    | 'logo_url'
    | 'logo_alternativo_url'
    | 'color_primario'
    | 'color_secundario'
    | 'color_acento'
    | 'texto_legal_recibos'
    | 'texto_legal_reportes'
    | 'pie_pagina_documentos'
    | 'stripe_habilitado'
    | 'stripe_estado'
    | 'stripe_modo'
    | 'stripe_public_key'
    | 'stripe_account_reference'
    | 'stripe_observaciones'
    | 'activo'
  >
>;

export interface GimnasioParametrizacionResponse {
  data: GimnasioParametrizacion;
}


export interface GimnasioLogoUploadResponse {
  data: {
    url: string;
    secure_url: string;
    public_id: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}


export interface GimnasioStripeStatus {
  stripe_habilitado: boolean;
  stripe_estado: string;
  stripe_modo: string;
  pagos_online_disponibles: boolean;
  mensaje: string | null;
}

export interface GimnasioStripeStatusResponse {
  data: GimnasioStripeStatus;
}

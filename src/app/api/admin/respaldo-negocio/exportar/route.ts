import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { exportRespaldoNegocio } from '@/services/adminRespaldoNegocioService';


// BUSINESS_BACKUP_I18N_EXPORTABLES_V1
type BusinessBackupLocale = "es" | "en";

const BUSINESS_BACKUP_MODULE_LABELS: Record<string, { en: string }> = {
  gimnasio_parametrizacion: { en: "Gym data" },
  socios: { en: "Members" },
  usuarios: { en: "Internal users" },
  empleados: { en: "Employees" },
  empleados_sueldos: { en: "Salaries" },
  cuotas: { en: "Fees" },
  pagos: { en: "Payments" },
  asistencias: { en: "Attendances" },
  ventas: { en: "Sales" },
  venta_detalle: { en: "Sales detail" },
  compras: { en: "Purchases" },
  compra_detalle: { en: "Purchases detail" },
  productos: { en: "Products / stock" },
  proveedores: { en: "Suppliers" },
  servicios: { en: "Services" },
  gastos_egresos: { en: "Expenses / outflows" },
  mensajes_socios: { en: "Member messages" },
  tickets_soporte: { en: "Dragon Pyramid tickets" },
};

function normalizeBusinessBackupLocale(value?: string | null): BusinessBackupLocale {
  return value === "en" ? "en" : "es";
}

function businessBackupFileStem(locale: BusinessBackupLocale): string {
  return locale === "en" ? "gym-master-business-backup" : "gym-master-respaldo-negocio";
}

function businessBackupModuleLabel(key: string, fallback: string, locale: BusinessBackupLocale) {
  return locale === "en" ? BUSINESS_BACKUP_MODULE_LABELS[key]?.en ?? fallback : fallback;
}

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user } = await authMiddleware(req);
    const body = await req.json().catch(() => ({}));
    const requestLocale = body?.locale ?? req.headers.get('x-gym-master-locale') ?? req.headers.get('accept-language');
    const result = await exportRespaldoNegocio(user, { ...body, locale: requestLocale });
    const responseBody = new Blob([new Uint8Array(result.buffer)], {
      type: result.contentType,
    });

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message.includes('No autorizado') || message.includes('Token') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

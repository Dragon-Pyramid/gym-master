import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  registrarAsistenciaQR,
  RegistroAsistenciaQRResponse,
} from "@/services/qrService";
import BienvenidaSocio from "./BienvenidaSocio";
import { Socio } from "@/interfaces/socio.interface";
import { Usuario } from "@/interfaces/usuario.interface";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useI18n } from "@/i18n/I18nProvider";
import type { GymMasterLocale } from "@/i18n/config";

type BrowserBarcodeDetector = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type BrowserBarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BrowserBarcodeDetector;


function qrTx(locale: GymMasterLocale, es: string, en: string) {
  return locale === "en" ? en : es;
}

function translateQrAccessMessage(locale: GymMasterLocale, value?: string | null) {
  if (!value || locale !== "en") return value ?? "";

  const normalized = value.trim().toLowerCase();

  const exact: Record<string, string> = {
    "asistencia registrada correctamente.": "Attendance registered successfully.",
    "asistencia registrada correctamente": "Attendance registered successfully.",
    "salida registrada correctamente.": "Exit registered successfully.",
    "salida registrada correctamente": "Exit registered successfully.",
    "no se pudo registrar la asistencia.": "Attendance could not be registered.",
    "no se pudo registrar la asistencia": "Attendance could not be registered.",
    "socio desactivado.": "Member deactivated.",
    "socio desactivado": "Member deactivated.",
    "usted está desactivado. regularice su situación en administración.":
      "Your account is deactivated. Please contact administration to regularize your status.",
  };

  if (exact[normalized]) return exact[normalized];

  return value
    .replace(/Asistencia registrada correctamente\.?/gi, "Attendance registered successfully.")
    .replace(/Salida registrada correctamente\.?/gi, "Exit registered successfully.")
    .replace(/No se pudo registrar la asistencia\.?/gi, "Attendance could not be registered.")
    .replace(/Socio desactivado\.?/gi, "Member deactivated.")
    .replace(/cuota pendiente/gi, "pending fee")
    .replace(/deuda/gi, "debt");
}

function getBarcodeDetectorConstructor() {
  if (typeof window === "undefined") return null;

  return (
    (
      window as Window & {
        BarcodeDetector?: BrowserBarcodeDetectorConstructor;
      }
    ).BarcodeDetector ?? null
  );
}

function getSocioDisplayData(res: RegistroAsistenciaQRResponse) {
  let id_socio: string | undefined;
  let nombre: string | undefined;
  let foto: string | null | undefined;

  if (res.asistencia?.socio) {
    const socio = res.asistencia.socio as Socio & {
      usuario_id?: { foto?: string | null; nombre?: string | null };
    };
    id_socio = socio.id_socio || undefined;
    nombre = socio.nombre_completo || undefined;
    foto = socio.usuario_id?.foto || undefined;
  }

  if ((!nombre || !id_socio) && res.socio) {
    id_socio = res.socio.id_socio || id_socio;
    nombre = res.socio.nombre_completo || nombre;
    foto = res.socio.foto ?? foto;
  }

  return { id_socio, nombre, foto };
}

function broadcastAdminAccessEvent(payload: {
  event_id: string;
  access_status?: string;
  alert_type?: "success" | "debt" | "inactive" | "error";
  tipo_movimiento?: "entrada" | "salida";
  mensaje_acceso?: string | null;
  socio?: {
    id_socio?: string;
    nombre_completo?: string;
    foto?: string | null;
  };
}) {
  const channel = supabaseBrowser.channel(
    "gym-master-asistencia-access-events",
  );
  const timeout = window.setTimeout(() => {
    supabaseBrowser.removeChannel(channel);
  }, 2000);

  channel.subscribe(async (status) => {
    if (status !== "SUBSCRIBED") return;

    window.clearTimeout(timeout);
    await channel.send({
      type: "broadcast",
      event: "access_event",
      payload,
    });

    window.setTimeout(() => {
      supabaseBrowser.removeChannel(channel);
    }, 300);
  });
}

export function RegistrarAsistenciaQR() {
  const { locale } = useI18n();
  const tr = (es: string, en: string) => qrTx(locale, es, en);
  const translateMessage = (value?: string | null) => translateQrAccessMessage(locale, value);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraHint, setCameraHint] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const loadingRef = useRef(false);

  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{
    nombre?: string;
    foto?: string | null;
    variant?: "success" | "debt" | "inactive";
    movementType?: "entrada" | "salida";
    message?: string | null;
  }>({});

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  };

  const handleScan = async (data: string | null) => {
    if (!data || loadingRef.current) return;

    const now = Date.now();
    if (
      lastScanRef.current?.value === data &&
      now - lastScanRef.current.at < 3000
    ) {
      return;
    }
    lastScanRef.current = { value: data, at: now };

    loadingRef.current = true;
    setLoading(true);
    setError("");
    setMessage("");
    setCameraHint("");

    try {
      const res = await registrarAsistenciaQR(data);

      const {
        id_socio,
        nombre: responseNombre,
        foto,
      } = getSocioDisplayData(res);
      let nombre = responseNombre;

      if (!nombre && "usuario" in res && res.usuario) {
        const usuario = res.usuario as Usuario;
        nombre = usuario.nombre || undefined;
      }

      if (!nombre) {
        try {
          const url = new URL(data);
          const qname = url.searchParams.get("nombre");
          if (qname) nombre = qname;
        } catch {}
      }

      const shouldNotifyAccessDisplay =
        res.alert_type === "success" ||
        res.alert_type === "debt" ||
        res.alert_type === "inactive" ||
        res.access_status === "al_dia" ||
        res.access_status === "deuda" ||
        res.access_status === "desactivado" ||
        res.access_status === "salida" ||
        res.tipo_movimiento === "salida";

      if (shouldNotifyAccessDisplay) {
        const asistenciaId =
          res.asistencia && "id" in res.asistencia
            ? String((res.asistencia as { id?: string }).id ?? "")
            : "";

        broadcastAdminAccessEvent({
          event_id: asistenciaId
            ? `asistencia-${asistenciaId}-${res.alert_type ?? "success"}`
            : `${res.access_status ?? res.alert_type ?? "access"}-${
                id_socio ?? "socio"
              }-${Date.now()}`,
          access_status: res.access_status,
          alert_type: res.alert_type,
          tipo_movimiento: res.tipo_movimiento,
          mensaje_acceso:
            res.mensaje_acceso ||
            res.message ||
            res.error ||
            tr("Asistencia registrada correctamente.", "Attendance registered successfully."),
          socio: {
            id_socio,
            nombre_completo: nombre,
            foto,
          },
        });
      }

      if (
        res.alert_type === "inactive" ||
        res.access_status === "desactivado"
      ) {
        setWelcomeData({
          nombre,
          foto,
          variant: "inactive",
          message:
            translateMessage(res.error) ||
            tr("Usted está desactivado. Regularice su situación en administración.", "Your account is deactivated. Please contact administration to regularize your status."),
        });
        setError(translateMessage(res.error) || tr("Socio desactivado.", "Member deactivated."));
        setShowWelcome(true);
        return;
      }

      if (res.error && !res.valido) {
        setError(translateMessage(res.error) || tr("No se pudo registrar la asistencia.", "Attendance could not be registered."));
        return;
      }

      if (res.valido || res.message) {
        const variant = res.alert_type === "debt" ? "debt" : "success";
        const movementType = res.tipo_movimiento;
        const finalMessage =
          translateMessage(res.mensaje_acceso || res.message) ||
          tr("Asistencia registrada correctamente.", "Attendance registered successfully.");

        setMessage(finalMessage);
        setWelcomeData({
          nombre,
          foto,
          variant,
          movementType,
          message:
            variant === "debt" || movementType === "salida"
              ? finalMessage
              : null,
        });
        setShowWelcome(true);
      } else {
        setError(tr("No se pudo registrar la asistencia.", "Attendance could not be registered."));
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      stopCamera();
      setError("");
      setMessage("");
      setCameraHint(tr("Iniciando cámara...", "Starting camera..."));
      setCameraReady(false);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraHint(
            tr("Este navegador no permite acceder a la cámara desde esta página.", "This browser does not allow camera access from this page."),
          );
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.muted = true;
        await video.play();

        if (cancelled) return;

        setCameraReady(true);
        setCameraHint("");

        const BarcodeDetectorClass = getBarcodeDetectorConstructor();

        if (!BarcodeDetectorClass) {
          setCameraHint(
            tr("La cámara está activa, pero este navegador no soporta detección QR nativa. Probá con Chrome actualizado.", "The camera is active, but this browser does not support native QR detection. Try an updated version of Chrome."),
          );
          return;
        }

        const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });

        scanTimerRef.current = window.setInterval(async () => {
          const currentVideo = videoRef.current;

          if (
            !currentVideo ||
            currentVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
            loadingRef.current
          ) {
            return;
          }

          try {
            const codes = await detector.detect(currentVideo);
            const text = codes.find((code) => code.rawValue)?.rawValue;

            if (text) {
              await handleScan(text);
            }
          } catch {
            // Error transitorio de frame: no se corta la cámara.
          }
        }, 450);
      } catch (cameraError: any) {
        const name = cameraError?.name;

        if (name === "NotAllowedError") {
          setCameraHint(
            tr("No se pudo acceder a la cámara. Revisá los permisos del navegador.", "Camera access was denied. Check your browser permissions."),
          );
          return;
        }

        if (name === "NotFoundError") {
          setCameraHint(tr("No se encontró una cámara disponible para escanear.", "No available camera was found for scanning."));
          return;
        }

        if (name === "NotReadableError") {
          setCameraHint(
            tr("La cámara está ocupada por otra aplicación o el navegador no pudo iniciarla.", "The camera is being used by another app or the browser could not start it."),
          );
          return;
        }

        setCameraHint(
          tr("No se pudo iniciar la cámara. Reintentá o actualizá la página.", "The camera could not be started. Try again or refresh the page."),
        );
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraKey]);

  return (
    <Card className="w-full max-w-xl mx-auto border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader>
        <CardTitle>{tr("Escanear QR para registrar asistencia", "Scan QR to register attendance")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center w-full max-w-xs overflow-hidden bg-slate-900 border rounded-lg aspect-square">
          <video
            ref={videoRef}
            className="absolute inset-0 object-cover w-full h-full"
            playsInline
            muted
            autoPlay
          />

          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-sm text-center text-white bg-slate-900">
              {tr("Iniciando cámara...", "Starting camera...")}
            </div>
          )}

          <div className="absolute inset-8 border-2 border-white/80 rounded-2xl shadow-[0_0_0_999px_rgba(15,23,42,0.28)]" />
          <div className="absolute w-12 h-1 -translate-x-1/2 bg-[#02a8e1] rounded-full top-8 left-1/2" />
          <div className="absolute w-12 h-1 -translate-x-1/2 bg-[#02a8e1] rounded-full bottom-8 left-1/2" />
        </div>

        <p className="max-w-sm text-xs text-center text-muted-foreground">
          {tr(
            "Apuntá la cámara al QR del día. El lector usa la cámara nativa del navegador para mostrar el preview y detectar el código.",
            "Point the camera at today's QR code. The reader uses the browser's native camera to show the preview and detect the code.",
          )}
        </p>

        {cameraHint && (
          <div className="max-w-sm text-sm font-medium text-center text-amber-700">
            {cameraHint}
          </div>
        )}

        {loading && <div className="text-blue-600 dark:text-sky-400">{tr("Registrando...", "Registering...")}</div>}
        {message && (
          <div
            className={`font-semibold text-center ${
              welcomeData.variant === "debt" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message}
          </div>
        )}
        {error && (
          <div className="font-semibold text-center text-red-600">{error}</div>
        )}
        <Button
          onClick={() => {
            setError("");
            setMessage("");
            setShowWelcome(false);
            setCameraHint("");
            setCameraReady(false);
            setCameraKey((value) => value + 1);
            lastScanRef.current = null;
          }}
        >
          {tr("Reintentar", "Try again")}
        </Button>
      </CardContent>
      {showWelcome && (
        <BienvenidaSocio
          locale={locale}
          nombre={welcomeData.nombre}
          foto={welcomeData.foto}
          variant={welcomeData.variant}
          movementType={welcomeData.movementType}
          message={welcomeData.message}
          onClose={() => setShowWelcome(false)}
        />
      )}
    </Card>
  );
}

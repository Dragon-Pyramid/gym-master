"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,  
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { fetchQrCode } from "@/services/qrService";

interface QrDisplayModalProps {
  open: boolean;
  onClose: () => void;
  refreshIntervalMs?: number;
}

type QrState = {
  data: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
};

export default function QrDisplayModal({
  open,
  onClose,
  refreshIntervalMs = 600000,
}: QrDisplayModalProps) {
  const [qrState, setQrState] = useState<QrState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchQr = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setQrState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const qrData = await fetchQrCode();
      setQrState({
        data: qrData,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo obtener el código QR";

      setQrState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      if (!isRetry) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchQr(true);
        }, 3000);
      }
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    fetchQr();
  }, [fetchQr]);

  const handleClose = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setQrState({
        data: null,
        loading: false,
        error: null,
        lastUpdated: null,
      });
      return;
    }

    fetchQr();
    intervalRef.current = setInterval(() => fetchQr(), refreshIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [open, fetchQr, refreshIntervalMs]);

  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col w-full max-w-4xl max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <DialogTitle className="text-2xl font-semibold text-center">
            Código QR de Acceso
          </DialogTitle>
          <DialogDescription className="text-base text-center text-muted-foreground">
            Escanea este código para acceder. Se actualiza automáticamente cada
            10 minutos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center flex-1 min-h-0 px-6 py-4">
          <div className="mb-6">
            <h3 className="mb-2 text-xl font-medium text-center">QR del Día</h3>
            {qrState.lastUpdated && (
              <p className="text-sm text-center text-muted-foreground">
                Última actualización: {formatLastUpdated(qrState.lastUpdated)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center w-full max-w-lg aspect-square">
            {qrState.loading ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-full aspect-square rounded-xl" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cargando código QR...
                </div>
              </div>
            ) : qrState.error ? (
              <div className="flex flex-col items-center max-w-md gap-3 text-center">
                <div className="text-lg font-medium text-destructive">
                  Error
                </div>
                <p className="text-destructive">{qrState.error}</p>
              </div>
            ) : qrState.data ? (
              <div className="w-full p-4 bg-white border shadow-sm aspect-square rounded-xl">
                <img
                  src={qrState.data || "/placeholder.svg"}
                  alt="Código QR de acceso"
                  className="object-contain w-full h-full"
                  style={{ imageRendering: "pixelated" }}
                  loading="eager"
                />
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-center gap-3 px-6 pt-4 pb-6">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={qrState.loading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw
              className={`w-4 h-4 ${qrState.loading ? "animate-spin" : ""}`}
            />
            Refrescar QR
          </Button>
          <DialogClose asChild>
            <Button variant="secondary">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { registrarAsistenciaQR } from "@/services/qrService";

const QrReader = dynamic(
  () => import("react-qr-reader").then((mod) => mod.QrReader),
  { ssr: false }
);

export function RegistrarAsistenciaQR() {
  const [scanResult, setScanResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleScan = async (data: string | null) => {
    if (!data || loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    setScanResult(data);
    const result = await registrarAsistenciaQR(data);
    if (result.message) {
      setMessage(result.message || "Asistencia registrada correctamente.");
    } else {
      setError(result.error || "No se pudo registrar la asistencia.");
    }
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Escanear QR para registrar asistencia</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center w-full max-w-xs bg-gray-100 rounded-lg aspect-square">
          <QrReader
            constraints={{ facingMode: "environment" }}
            onResult={(result, error) => {
              if (result && typeof result.getText === "function") {
                const text = result.getText();
                if (text) handleScan(text);
              }
              if (error && error.name === "NotAllowedError")
                setError("No se pudo acceder a la cámara.");
            }}
          />
        </div>
        {loading && <div className="text-blue-600">Registrando...</div>}
        {message && (
          <div className="font-semibold text-green-600">{message}</div>
        )}
        {error && <div className="font-semibold text-red-600">{error}</div>}
        <Button onClick={() => setScanResult("")}>Reintentar</Button>
      </CardContent>
    </Card>
  );
}

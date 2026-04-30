'use client';

import { useEffect, useState } from 'react';

export default function FechaHora() {
  const [fechaHora, setFechaHora] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setFechaHora(
        new Date().toLocaleString("es-PE", {
          dateStyle: "short",
          timeStyle: "medium",
        })
      );
    }, 1000);

    setFechaHora(
      new Date().toLocaleString("es-PE", {
        dateStyle: "short",
        timeStyle: "medium",
      })
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm font-medium text-muted-foreground">
      {isClient ? fechaHora : null}
    </div>
  );
}

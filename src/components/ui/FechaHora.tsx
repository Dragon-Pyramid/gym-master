'use client';

import { useEffect, useState } from 'react';
import { formatFrontendDateTime } from '@/utils/dateFormat';

export default function FechaHora() {
  const [fechaHora, setFechaHora] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setFechaHora(
        formatFrontendDateTime(new Date())
      );
    }, 1000);

    setFechaHora(
      formatFrontendDateTime(new Date())
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm font-medium text-muted-foreground">
      {isClient ? fechaHora : null}
    </div>
  );
}

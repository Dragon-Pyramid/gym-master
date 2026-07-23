'use client';

import { useEffect, useState } from 'react';
import { formatFrontendDateTime } from '@/utils/dateFormat';
import { useI18n } from '@/i18n/I18nProvider';

export default function FechaHora() {
  const { locale } = useI18n();
  const dateLocale = locale === 'en' ? 'en-US' : 'es-AR';
  const [fechaHora, setFechaHora] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setFechaHora(
        formatFrontendDateTime(new Date(), dateLocale)
      );
    }, 1000);

    setFechaHora(
      formatFrontendDateTime(new Date(), dateLocale)
    );

    return () => clearInterval(interval);
  }, [dateLocale]);

  return (
    <div className="text-sm font-medium text-muted-foreground">
      {isClient ? fechaHora : null}
    </div>
  );
}

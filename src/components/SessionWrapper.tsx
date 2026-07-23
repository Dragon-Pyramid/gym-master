'use client';

import { SessionProvider } from 'next-auth/react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/services/supabaseClient';
import { ThemeProvider } from '@/components/theme-provider';
import { ReactNode, useEffect } from 'react';
import { I18nProvider } from '@/i18n/I18nProvider';
import type { GymMasterLocale } from '@/i18n/config';
import { clearSensitivePwaCaches } from '@/utils/pwaCacheSecurity';
import { PwaServiceWorkerRegistrar } from '@/components/pwa/PwaServiceWorkerRegistrar';

export function SessionWrapper({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: GymMasterLocale;
}) {
  useEffect(() => {
    void clearSensitivePwaCaches();
  }, []);

  return (
    <>
      <PwaServiceWorkerRegistrar />
      <SessionProvider>
        <SessionContextProvider supabaseClient={supabase}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
          </ThemeProvider>
        </SessionContextProvider>
      </SessionProvider>
    </>
  );
}

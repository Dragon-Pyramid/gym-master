'use client';

import { SessionProvider } from 'next-auth/react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/services/supabaseClient';
import { ThemeProvider } from '@/components/theme-provider';
import { ReactNode } from 'react';

export function SessionWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SessionContextProvider supabaseClient={supabase}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </SessionContextProvider>
    </SessionProvider>
  );
}

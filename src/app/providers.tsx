'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { SidebarProvider } from '@/components/ui/sidebar'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          {children}
          <Toaster position="top-right" richColors />
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

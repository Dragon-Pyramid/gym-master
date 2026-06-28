import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { SessionWrapper } from '@/components/SessionWrapper';
import { QaCurrentPageBadge } from '@/components/qa/QaCurrentPageBadge';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Gym Master',
    template: '%s | Gym Master',
  },
  description: 'ERP inteligente para la gestión integral de gimnasios.',
  applicationName: 'Gym Master',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Gym Master',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'Gym Master',
    'msapplication-TileColor': '#0f172a',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es'>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionWrapper>
          {children}
          <QaCurrentPageBadge />
          <Toaster position='top-right' richColors />
        </SessionWrapper>
      </body>
    </html>
  );
}

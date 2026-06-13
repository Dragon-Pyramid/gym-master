import type { Metadata } from 'next';
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
  title: 'Gym Master',
  description: 'ERP inteligente para la gestion integral de gimnasios',
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

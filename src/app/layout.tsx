import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { SessionWrapper } from '@/components/SessionWrapper'; // ✅ Import del wrapper cliente

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gym Master',
  description: 'Sistema de administración de gimnasios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='es'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <SessionWrapper>
          {children}
          <Toaster position='top-right' richColors />
        </SessionWrapper>
      </body>
    </html>
  );
}

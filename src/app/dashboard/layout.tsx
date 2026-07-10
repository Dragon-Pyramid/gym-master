import DashboardRouteGuard from '@/components/auth/DashboardRouteGuard';
import DashboardInlineI18nSweep from '@/components/i18n/DashboardInlineI18nSweep';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardRouteGuard>
      <DashboardInlineI18nSweep />
      {children}
    </DashboardRouteGuard>
  );
}

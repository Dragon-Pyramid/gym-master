import DashboardRouteGuard from '@/components/auth/DashboardRouteGuard';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardRouteGuard>{children}</DashboardRouteGuard>;
}

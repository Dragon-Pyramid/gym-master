'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import SociosDietasGrid from '@/components/gestion-dietas/SociosDietasGrid';
import { fetchSocios } from '@/services/socioService';
import { Socio } from '@/interfaces/socio.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { useI18n } from '@/i18n/I18nProvider';

export default function GestionDietasPage() {
  const { isAuthenticated, initializeAuth, isInitialized, user } = useAuthStore();
  const router = useRouter();
  const { locale } = useI18n();
  const tx = (es: string, en: string) => (locale === 'en' ? en : es);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [filteredSocios, setFilteredSocios] = useState<Socio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadSocios = async () => {
    setLoading(true);
    try {
      const data = await fetchSocios(user as JwtUser);
      setSocios(data ?? []);
      setFilteredSocios(data ?? []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadSocios();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSocios(socios);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = socios.filter(
        (s) =>
          s.nombre_completo.toLowerCase().includes(lowercaseSearch) ||
          s.dni.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredSocios(filtered);
    }
  }, [searchTerm, socios]);

  if (loading || !isInitialized) {
    return (
      <div className='flex items-center justify-center h-screen'>
        {tx('Cargando datos de socios...', 'Loading member data...')}
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={tx('Gestión de dietas', 'Diet management')} />
          <main className='flex-1 p-6 space-y-6'>
            <Card className='w-full'>
              <CardHeader className='flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap'>
                <h2 className='text-xl font-bold'>{tx('Dietas de socios', 'Member diets')}</h2>
                <div className='relative flex-grow md:flex-grow-0'>
                  <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    type='search'
                    placeholder={tx('Buscar por nombre o DNI...', 'Search by name or DNI...')}
                    className='pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className='p-4'>
                <SociosDietasGrid socios={filteredSocios} loading={loading} />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

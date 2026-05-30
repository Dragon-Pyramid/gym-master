'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AppHeader } from '@/components/header/AppHeader';
import { AppFooter } from '@/components/footer/AppFooter';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { Search } from 'lucide-react';
import SociosRutinasGrid from '@/components/gestor-rutinas/SociosRutinasGrid';
import { fetchSocios } from '@/services/socioService';
import { getObjetivos, getNiveles } from '@/services/apiClient';
import { Socio } from '@/interfaces/socio.interface';
import { JwtUser } from '@/interfaces/jwtUser.interface';
import { Objetivo } from '@/interfaces/objetivo.interface';
import { Nivel } from '@/interfaces/niveles.interface';

const GESTOR_RUTINAS_PAGE_SIZE = 12;

export default function GestorRutinasPage() {
  const { isAuthenticated, initializeAuth, isInitialized, user } =
    useAuthStore();
  const router = useRouter();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [filteredSocios, setFilteredSocios] = useState<Socio[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isInitialized, router]);

  const loadSocios = useCallback(async () => {
    setLoading(true);
    try {
      const [sociosData, objetivosResponse, nivelesResponse] = await Promise.all([
        fetchSocios(user as JwtUser),
        getObjetivos(),
        getNiveles(),
      ]);

      setSocios(sociosData ?? []);
      setFilteredSocios(sociosData ?? []);

      if (objetivosResponse.ok) {
        setObjetivos(objetivosResponse.data ?? []);
      }

      if (nivelesResponse.ok) {
        setNiveles(nivelesResponse.data ?? []);
      }
    } catch (error) {
      console.error('Error al cargar socios/objetivos/niveles:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      loadSocios();
    }
  }, [isInitialized, isAuthenticated, user, loadSocios]);

  useEffect(() => {
    const orderedSocios = [...socios].sort((a, b) =>
      a.nombre_completo.localeCompare(b.nombre_completo, 'es')
    );

    if (searchTerm.trim() === '') {
      setFilteredSocios(orderedSocios);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = orderedSocios.filter(
        (s) =>
          s.nombre_completo.toLowerCase().includes(lowercaseSearch) ||
          s.dni.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredSocios(filtered);
    }
  }, [searchTerm, socios]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalSocios = filteredSocios.length;
  const totalPages = Math.max(1, Math.ceil(totalSocios / GESTOR_RUTINAS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSocios = filteredSocios.slice(
    (safeCurrentPage - 1) * GESTOR_RUTINAS_PAGE_SIZE,
    safeCurrentPage * GESTOR_RUTINAS_PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading || !isInitialized) {
    return (
      <div className='flex items-center justify-center h-screen'>
        Cargando datos de socios...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className='flex w-full min-h-screen'>
        <AppSidebar />
        <SidebarInset>
          <AppHeader title='Gestor de Rutinas' />
          <main className='flex-1 p-6 space-y-6'>
            <Card className='w-full'>
              <CardHeader className='flex flex-wrap items-center justify-between gap-4 p-4 border-b md:flex-nowrap'>
                <h2 className='text-xl font-bold'>Rutinas de Socios</h2>
                <div className='relative flex-grow md:flex-grow-0'>
                  <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    type='search'
                    placeholder='Buscar por nombre o DNI...'
                    className='pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className='p-4'>
                <SociosRutinasGrid
                  socios={paginatedSocios}
                  loading={loading}
                  objetivos={objetivos}
                  niveles={niveles}
                />
                <PaginationControls
                  currentPage={safeCurrentPage}
                  totalItems={totalSocios}
                  pageSize={GESTOR_RUTINAS_PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="socios"
                />
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

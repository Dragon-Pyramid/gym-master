"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import AvisosTable from "@/components/tables/AvisosTable";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getAllAvisos, deleteAviso } from "@/services/avisoService";
import { Aviso } from "@/interfaces/aviso.interface";
import AvisosModal from "@/components/modal/AvisosModal";
import AvisosModalView from "@/components/modal/AvisosModalView";
import { useI18n } from "@/i18n/I18nProvider";

export default function AvisosPage() {
  const { user, isAuthenticated, initializeAuth, isInitialized } =
    useAuthStore();
  const { locale } = useI18n();
  const c = (es: string, en: string) => (locale === "en" ? en : es);
  const router = useRouter();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [filteredAvisos, setFilteredAvisos] = useState<Aviso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState<Aviso | null>(null);
  const [openModalVer, setOpenModalVer] = useState(false);
  const [avisoVer, setAvisoVer] = useState<Aviso | null>(null);

  const fetchAvisos = async () => {
    setLoading(true);
    try {
      const data = await getAllAvisos();
      setAvisos(data.filter((a) => a.activo !== false));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      fetchAvisos();
    }
  }, [isInitialized, isAuthenticated]);

  useEffect(() => {
    let avisosFiltrados = avisos;
    if (searchTerm.trim() !== "") {
      const lowercaseSearch = searchTerm.toLowerCase();
      avisosFiltrados = avisosFiltrados.filter(
        (a) =>
          a.titulo.toLowerCase().includes(lowercaseSearch) ||
          a.mensaje.toLowerCase().includes(lowercaseSearch) ||
          a.tipo.toLowerCase().includes(lowercaseSearch) ||
          a.fecha_envio.toLowerCase().includes(lowercaseSearch)
      );
    }
    setFilteredAvisos(avisosFiltrados);
  }, [searchTerm, avisos]);

  const handleDelete = async (aviso: Aviso) => {
    setLoading(true);
    try {
      await deleteAviso(aviso.id);
      fetchAvisos();
    } catch {}
    setLoading(false);
  };

  if (!isInitialized) {
    return <div>{c("Cargando...", "Loading...")}</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title={c("Avisos", "Notices")} />
          <main className="flex-1 p-6 space-y-6 bg-slate-50/60 dark:bg-slate-950">
            <Card className="w-full overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
              <CardHeader className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-200 md:flex-nowrap dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">
                    {c("Listado de avisos", "Notices list")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c(
                      "Gestioná avisos enviados, mensajes internos y comunicaciones al socio.",
                      "Manage sent notices, internal messages, and member communications."
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center w-full gap-2 md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={c(
                        "Buscar por título, mensaje, tipo o fecha...",
                        "Search by title, message, type, or date..."
                      )}
                      className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] w-full dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    className="bg-[#02a8e1] hover:bg-[#0288b1] text-white"
                    onClick={() => {
                      setSelectedAviso(null);
                      setOpenModal(true);
                    }}
                  >
                    {c("Nuevo aviso", "New notice")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <AvisosTable
                    avisos={filteredAvisos}
                    loading={loading}
                    onEdit={(aviso) => {
                      setSelectedAviso(aviso);
                      setOpenModal(true);
                    }}
                    onView={(aviso) => {
                      setAvisoVer(aviso);
                      setOpenModalVer(true);
                    }}
                    onDelete={handleDelete}
                  />
                </div>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
      <AvisosModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedAviso(null);
        }}
        onCreated={() => {
          setOpenModal(false);
          fetchAvisos();
        }}
        aviso={selectedAviso}
      />
      <AvisosModalView
        open={openModalVer}
        onClose={() => {
          setOpenModalVer(false);
          setAvisoVer(null);
        }}
        aviso={avisoVer}
      />
    </SidebarProvider>
  );
}

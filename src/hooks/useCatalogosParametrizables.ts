"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CatalogoParametrizableItem,
  CatalogoParametrizableKey,
  CatalogoParametrizableSummary,
} from "@/interfaces/parametrizacion.interface";
import { getParametrizacionCatalogos } from "@/services/parametrizacionService";

export function useCatalogosParametrizables() {
  const [catalogos, setCatalogos] = useState<CatalogoParametrizableSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalogos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getParametrizacionCatalogos();
      setCatalogos(response.catalogos ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al cargar catálogos parametrizables";
      setError(message);
      setCatalogos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogos();
  }, [loadCatalogos]);

  return {
    catalogos,
    loading,
    error,
    reload: loadCatalogos,
  };
}

export function useCatalogoParametrizable(
  key: CatalogoParametrizableKey,
  fallbackItems: CatalogoParametrizableItem[] = []
) {
  const { catalogos, loading, error, reload } = useCatalogosParametrizables();

  const catalogo = useMemo(
    () => catalogos.find((item) => item.key === key) ?? null,
    [catalogos, key]
  );

  const items = useMemo(() => {
    const activos = (catalogo?.items ?? []).filter((item) => item.activo);
    return activos.length > 0 ? activos : fallbackItems;
  }, [catalogo, fallbackItems]);

  return {
    catalogo,
    items,
    loading,
    error,
    reload,
  };
}

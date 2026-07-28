"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Asistencia,
  CreateAsistenciaDto,
  UpdateAsistenciaDto,
} from "@/interfaces/asistencia.interface";
import type { Socio } from "@/interfaces/socio.interface";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import {
  createAsistencia,
  updateAsistencia,
} from "@/services/browser/asistenciaApiClient";
import { fetchSocios } from "@/services/browser/socioApiClient";
import { toast } from "sonner";

export interface AsistenciaFormProps {
  asistencia?: Asistencia | null;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm = {
  id_socio: "",
  fecha: "",
  hora_ingreso: "",
  hora_egreso: "",
};

export default function AsistenciaForm({
  asistencia,
  onCreated,
  onCancel,
}: AsistenciaFormProps) {
  const { locale } = useI18n();

  const attendanceText = (es: string, en: string) =>
    locale === "en" ? en : es;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const [socios, setSocios] = useState<Socio[]>([]);
  const [loadingSocios, setLoadingSocios] = useState(true);
  const [sociosLoadError, setSociosLoadError] = useState(false);
  const [socioPickerOpen, setSocioPickerOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSocios = async () => {
      setLoadingSocios(true);
      setSociosLoadError(false);

      try {
        const data = await fetchSocios();

        if (mounted) {
          setSocios(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) {
          setSocios([]);
          setSociosLoadError(true);
        }
      } finally {
        if (mounted) {
          setLoadingSocios(false);
        }
      }
    };

    void loadSocios();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (asistencia) {
      setForm({
        id_socio: asistencia.socio_id ?? "",
        fecha: asistencia.fecha ?? "",
        hora_ingreso: asistencia.hora_ingreso ?? "",
        hora_egreso: asistencia.hora_egreso ?? "",
      });
    } else {
      setForm(emptyForm);
    }

    setSocioPickerOpen(false);
  }, [asistencia]);

  const selectableSocios = useMemo(() => {
    const collator = new Intl.Collator(
      locale === "en" ? "en" : "es",
      {
        sensitivity: "base",
        numeric: true,
      }
    );

    return [...socios]
      .filter(
        (socio) =>
          socio.activo ||
          socio.id_socio === form.id_socio
      )
      .sort((a, b) =>
        collator.compare(
          a.nombre_completo || "",
          b.nombre_completo || ""
        )
      );
  }, [form.id_socio, locale, socios]);

  const selectedSocio = useMemo(
    () =>
      socios.find(
        (socio) => socio.id_socio === form.id_socio
      ) ?? null,
    [form.id_socio, socios]
  );

  const selectedSocioName =
    selectedSocio?.nombre_completo ||
    asistencia?.socio?.nombre_completo ||
    "";

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!form.id_socio) {
      toast.error(
        attendanceText(
          "Seleccioná un socio",
          "Select a member"
        )
      );
      return;
    }

    setLoading(true);

    try {
      if (asistencia?.id) {
        const updateData: UpdateAsistenciaDto = {
          socio_id: form.id_socio,
          fecha: form.fecha,
          hora_ingreso: form.hora_ingreso,
          hora_egreso: form.hora_egreso || null,
        };

        await updateAsistencia(
          undefined as any,
          asistencia.id,
          updateData
        );

        toast.success(
          attendanceText(
            "Asistencia actualizada",
            "Attendance updated"
          )
        );
      } else {
        const createData: CreateAsistenciaDto = {
          socio_id: form.id_socio,
          fecha: form.fecha,
          hora_ingreso: form.hora_ingreso,
          hora_egreso: form.hora_egreso || null,
        };

        await createAsistencia(
          undefined as any,
          createData
        );

        toast.success(
          attendanceText(
            "Asistencia creada",
            "Attendance created"
          )
        );
      }

      setForm(emptyForm);
      setSocioPickerOpen(false);
      onCreated();
    } catch (error: unknown) {
      const rawMessage =
        error instanceof Error ? error.message : "";

      const message = rawMessage.includes(
        "value too long"
      )
        ? attendanceText(
            "Uno de los campos excede la cantidad máxima de caracteres permitidos.",
            "One of the fields exceeds the maximum allowed length."
          )
        : locale === "es" && rawMessage
          ? rawMessage
          : attendanceText(
              "Error al guardar asistencia",
              "Error saving attendance"
            );

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <QaFileNameBadge file="src/components/forms/AsistenciaForm.tsx" />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="id_socio">
          {attendanceText("Socio", "Member")}
        </Label>

        <Popover
          open={socioPickerOpen}
          onOpenChange={(open) => {
            if (!loadingSocios) {
              setSocioPickerOpen(open);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id="id_socio"
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={socioPickerOpen}
              aria-label={attendanceText(
                "Seleccionar socio",
                "Select member"
              )}
              className="w-full justify-between font-normal"
              disabled={loading || loadingSocios}
            >
              <span className="min-w-0 truncate text-left">
                {loadingSocios
                  ? attendanceText(
                      "Cargando socios...",
                      "Loading members..."
                    )
                  : selectedSocioName ||
                    attendanceText(
                      "Seleccioná un socio",
                      "Select a member"
                    )}
              </span>

              {loadingSocios ? (
                <Loader2
                  className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-60"
                  aria-hidden
                />
              ) : (
                <ChevronsUpDown
                  className="ml-2 h-4 w-4 shrink-0 opacity-50"
                  aria-hidden
                />
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] p-0"
          >
            <Command>
              <CommandInput
                placeholder={attendanceText(
                  "Buscar por nombre, DNI o email...",
                  "Search by name, DNI or email..."
                )}
                className="h-9"
              />

              <CommandList className="max-h-72">
                <CommandEmpty>
                  {attendanceText(
                    "No se encontró ningún socio.",
                    "No members found."
                  )}
                </CommandEmpty>

                <CommandGroup>
                  {selectableSocios.map((socio) => {
                    const searchableValue = [
                      socio.nombre_completo,
                      socio.dni,
                      socio.email,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const secondaryText = [
                      socio.dni
                        ? `DNI ${socio.dni}`
                        : "",
                      socio.email || "",
                      !socio.activo
                        ? attendanceText(
                            "Inactivo",
                            "Inactive"
                          )
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return (
                      <CommandItem
                        key={socio.id_socio}
                        value={searchableValue}
                        onSelect={() => {
                          setForm((previous) => ({
                            ...previous,
                            id_socio: socio.id_socio,
                          }));

                          setSocioPickerOpen(false);
                        }}
                        className="gap-2"
                      >
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">
                            {socio.nombre_completo}
                          </span>

                          {secondaryText ? (
                            <span className="truncate text-xs text-muted-foreground">
                              {secondaryText}
                            </span>
                          ) : null}
                        </span>

                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            form.id_socio ===
                              socio.id_socio
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                          aria-hidden
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {sociosLoadError ? (
          <p className="text-xs text-destructive">
            {attendanceText(
              "No se pudieron cargar los socios. Cerrá y volvé a abrir el formulario.",
              "Members could not be loaded. Close and reopen the form."
            )}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha">
          {attendanceText("Fecha", "Date")}
        </Label>

        <Input
          id="fecha"
          name="fecha"
          type="date"
          value={form.fecha}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hora_ingreso">
          {attendanceText(
            "Hora Ingreso",
            "Check-in time"
          )}
        </Label>

        <Input
          id="hora_ingreso"
          name="hora_ingreso"
          type="time"
          placeholder="HH:MM"
          value={form.hora_ingreso}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hora_egreso">
          {attendanceText(
            "Hora Egreso",
            "Check-out time"
          )}
        </Label>

        <Input
          id="hora_egreso"
          name="hora_egreso"
          type="time"
          placeholder={attendanceText(
            "HH:MM (Opcional)",
            "HH:MM (Optional)"
          )}
          value={form.hora_egreso}
          onChange={handleChange}
        />
      </div>

      <div className="col-span-full flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          {attendanceText("Cancelar", "Cancel")}
        </Button>

        <Button
          type="submit"
          disabled={
            loading ||
            loadingSocios ||
            !form.id_socio
          }
        >
          {loading
            ? attendanceText(
                "Guardando...",
                "Saving..."
              )
            : asistencia
              ? attendanceText(
                  "Actualizar Asistencia",
                  "Update attendance"
                )
              : attendanceText(
                  "Registrar Asistencia",
                  "Register attendance"
                )}
        </Button>
      </div>
    </form>
  );
}

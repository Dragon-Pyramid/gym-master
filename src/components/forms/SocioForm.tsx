"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createSocioApi, updateSocioApi } from "@/services/browser/socioApiClient";
import { Socio } from "@/interfaces/socio.interface";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";

export interface SocioFormProps {
  socio?: Socio | null;
  onCreated: () => void;
}

const emptyForm = {
  nombre_completo: "",
  dni: "",
  sexo: "",
  fecnac: "",
  direccion: "",
  ciudad: "",
  provincia: "",
  pais: "Argentina",
  telefono: "",
  email: "",
  contacto_emergencia_nombre: "",
  contacto_emergencia_telefono: "",
  fecha_alta: "",
};

export default function SocioForm({ socio, onCreated }: SocioFormProps) {
  const { locale } = useI18n();
  const tx = (es: string, en: string) => (locale === "en" ? en : es);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socio) {
      setForm({
        nombre_completo: socio.nombre_completo ?? "",
        dni: socio.dni ?? "",
        sexo: socio.sexo ?? "",
        fecnac: socio.fecnac ?? "",
        direccion: socio.direccion ?? "",
        ciudad: socio.ciudad ?? "",
        provincia: socio.provincia ?? "",
        pais: socio.pais ?? "Argentina",
        telefono: socio.telefono ?? "",
        email: socio.email ?? "",
        contacto_emergencia_nombre: socio.contacto_emergencia_nombre ?? "",
        contacto_emergencia_telefono: socio.contacto_emergencia_telefono ?? "",
        fecha_alta: socio.fecha_alta ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [socio]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => ({
    nombre_completo: form.nombre_completo,
    dni: form.dni,
    sexo: form.sexo ? (form.sexo as "M" | "F") : null,
    fecnac: form.fecnac || null,
    direccion: form.direccion,
    ciudad: form.ciudad,
    provincia: form.provincia,
    pais: form.pais,
    telefono: form.telefono,
    email: form.email,
    contacto_emergencia_nombre: form.contacto_emergencia_nombre,
    contacto_emergencia_telefono: form.contacto_emergencia_telefono,
    fecha_alta: form.fecha_alta || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (socio && socio.id_socio) {
        await updateSocioApi(socio.id_socio, buildPayload());
        toast.success(tx("Socio actualizado", "Member updated"));
      } else {
        await createSocioApi({
          usuario_id: "",
          ...buildPayload(),
        });
        toast.success(tx("Socio creado", "Member created"));
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      const rawMessage = String(error?.message ?? "");
      const message = rawMessage.includes("value too long")
        ? tx(
            "Uno de los campos excede la cantidad máxima de caracteres permitidos.",
            "One of the fields exceeds the maximum allowed length."
          )
        : locale === "es" && rawMessage
          ? rawMessage
          : tx("Error al guardar socio", "Could not save the member");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <QaFileNameBadge file="src/components/forms/SocioForm.tsx" />
      <div className="col-span-full">
        <h3 className="text-sm font-semibold text-muted-foreground">{tx("Datos personales", "Personal details")}</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre_completo">{tx("Nombre completo", "Full name")}</Label>
        <Input id="nombre_completo" name="nombre_completo" placeholder={tx("Ingrese nombre completo", "Enter full name")} value={form.nombre_completo} onChange={handleChange} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dni">DNI</Label>
        <Input id="dni" name="dni" placeholder={tx("Ingrese DNI", "Enter DNI")} value={form.dni} onChange={handleChange} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sexo">{tx("Sexo", "Sex")}</Label>
        <select id="sexo" name="sexo" value={form.sexo} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <option value="">{tx("Seleccionar", "Select")}</option>
          <option value="M">{tx("Masculino", "Male")}</option>
          <option value="F">{tx("Femenino", "Female")}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecnac">{tx("Fecha de nacimiento", "Birth date")}</Label>
        <Input id="fecnac" name="fecnac" type="date" value={form.fecnac} onChange={handleChange} />
      </div>

      <div className="col-span-full">
        <h3 className="text-sm font-semibold text-muted-foreground">{tx("Contacto y ubicación", "Contact and location")}</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">{tx("Teléfono", "Phone")}</Label>
        <Input id="telefono" name="telefono" placeholder={tx("Ingrese teléfono", "Enter phone number")} value={form.telefono} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder={tx("Ingrese correo electrónico", "Enter email address")} value={form.email} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="direccion">{tx("Dirección", "Address")}</Label>
        <Input id="direccion" name="direccion" placeholder={tx("Ingrese dirección", "Enter address")} value={form.direccion} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ciudad">{tx("Ciudad", "City")}</Label>
        <Input id="ciudad" name="ciudad" placeholder={tx("Ingrese ciudad", "Enter city")} value={form.ciudad} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provincia">{tx("Provincia", "Province")}</Label>
        <Input id="provincia" name="provincia" placeholder={tx("Ingrese provincia", "Enter province")} value={form.provincia} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pais">{tx("País", "Country")}</Label>
        <Input id="pais" name="pais" placeholder={tx("Ingrese país", "Enter country")} value={form.pais} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_alta">{tx("Fecha de alta", "Registration date")}</Label>
        <Input id="fecha_alta" name="fecha_alta" type="date" value={form.fecha_alta} onChange={handleChange} />
      </div>

      <div className="col-span-full">
        <h3 className="text-sm font-semibold text-muted-foreground">{tx("Contacto de emergencia", "Emergency contact")}</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contacto_emergencia_nombre">{tx("Nombre del contacto", "Contact name")}</Label>
        <Input id="contacto_emergencia_nombre" name="contacto_emergencia_nombre" placeholder={tx("Ej.: familiar o responsable", "E.g. relative or guardian")} value={form.contacto_emergencia_nombre} onChange={handleChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contacto_emergencia_telefono">{tx("Teléfono de emergencia", "Emergency phone")}</Label>
        <Input id="contacto_emergencia_telefono" name="contacto_emergencia_telefono" placeholder={tx("Teléfono para urgencias", "Phone number for emergencies")} value={form.contacto_emergencia_telefono} onChange={handleChange} />
      </div>

      <Button type="submit" className="col-span-full justify-self-end" disabled={loading}>
        {loading
          ? tx("Guardando...", "Saving...")
          : socio
            ? tx("Actualizar socio", "Update member")
            : tx("Crear socio", "Create member")}
      </Button>
    </form>
  );
}

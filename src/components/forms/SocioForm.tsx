"use client";

import { QaFileNameBadge } from "@/components/qa/QaFileNameBadge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createSocioApi, updateSocioApi } from "@/services/browser/socioApiClient";
import { Socio } from "@/interfaces/socio.interface";
import { toast } from "sonner";

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
        toast.success("Socio actualizado");
      } else {
        await createSocioApi({
          usuario_id: "",
          ...buildPayload(),
        });
        toast.success("Socio creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: any) {
      let msg = error.message || "Error al guardar socio";
      if (msg.includes("value too long")) {
        msg = "Uno de los campos excede la cantidad máxima de caracteres permitidos.";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <QaFileNameBadge file="src/components/forms/SocioForm.tsx" />
      <div className="col-span-full">
        <h3 className="text-sm font-semibold text-muted-foreground">Datos personales</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre_completo">Nombre completo</Label>
        <Input
          id="nombre_completo"
          name="nombre_completo"
          placeholder="Ingrese nombre completo"
          value={form.nombre_completo}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dni">DNI</Label>
        <Input
          id="dni"
          name="dni"
          placeholder="Ingrese DNI"
          value={form.dni}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sexo">Sexo</Label>
        <select
          id="sexo"
          name="sexo"
          value={form.sexo}
          onChange={handleChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Seleccionar</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecnac">Fecha de nacimiento</Label>
        <Input
          id="fecnac"
          name="fecnac"
          type="date"
          value={form.fecnac}
          onChange={handleChange}
        />
      </div>

      <div className="col-span-full">
        <h3 className="text-sm font-semibold text-muted-foreground">Contacto y ubicación</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          placeholder="Ingrese teléfono"
          value={form.telefono}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Ingrese correo electrónico"
          value={form.email}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          name="direccion"
          placeholder="Ingrese dirección"
          value={form.direccion}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ciudad">Ciudad</Label>
        <Input
          id="ciudad"
          name="ciudad"
          placeholder="Ingrese ciudad"
          value={form.ciudad}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provincia">Provincia</Label>
        <Input
          id="provincia"
          name="provincia"
          placeholder="Ingrese provincia"
          value={form.provincia}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pais">País</Label>
        <Input
          id="pais"
          name="pais"
          placeholder="Ingrese país"
          value={form.pais}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha_alta">Fecha de alta</Label>
        <Input
          id="fecha_alta"
          name="fecha_alta"
          type="date"
          value={form.fecha_alta}
          onChange={handleChange}
        />
      </div>

      <div className="col-span-full">
        <h3 className="text-sm font-semibold text-muted-foreground">Contacto de emergencia</h3>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contacto_emergencia_nombre">Nombre del contacto</Label>
        <Input
          id="contacto_emergencia_nombre"
          name="contacto_emergencia_nombre"
          placeholder="Ej: familiar o responsable"
          value={form.contacto_emergencia_nombre}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contacto_emergencia_telefono">Teléfono de emergencia</Label>
        <Input
          id="contacto_emergencia_telefono"
          name="contacto_emergencia_telefono"
          placeholder="Teléfono para urgencias"
          value={form.contacto_emergencia_telefono}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" className="col-span-full justify-self-end" disabled={loading}>
        {loading ? "Guardando..." : socio ? "Actualizar Socio" : "Crear Socio"}
      </Button>
    </form>
  );
}

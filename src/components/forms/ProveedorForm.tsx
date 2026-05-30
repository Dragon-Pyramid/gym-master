"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Proveedor,
  CreateProveedorDto,
  UpdateProveedorDto,
  PROVEEDOR_ESTADOS,
} from "@/interfaces/proveedor.interface";
import { createProveedor, updateProveedor } from "@/services/proveedorService";
import { toast } from "sonner";

export interface ProveedorFormProps {
  proveedor?: Proveedor | null;
  onCreated: () => void;
  onCancel: () => void;
}

const emptyForm: CreateProveedorDto = {
  nombre: "",
  razon_social: "",
  identificacion_fiscal: "",
  condicion_fiscal: "",
  contacto: "",
  telefono: "",
  whatsapp: "",
  email: "",
  direccion: "",
  ciudad: "",
  provincia: "",
  pais: "Argentina",
  rubro: "",
  estado: "activo",
  banco: "",
  alias_cbu: "",
  cbu_cvu: "",
  titular_cuenta: "",
  observaciones: "",
};

export default function ProveedorForm({
  proveedor,
  onCreated,
  onCancel,
}: ProveedorFormProps) {
  const [form, setForm] = useState<CreateProveedorDto>(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proveedor) {
      setForm({
        nombre: proveedor.nombre ?? "",
        razon_social: proveedor.razon_social ?? "",
        identificacion_fiscal: proveedor.identificacion_fiscal ?? "",
        condicion_fiscal: proveedor.condicion_fiscal ?? "",
        contacto: proveedor.contacto ?? "",
        telefono: proveedor.telefono ?? "",
        whatsapp: proveedor.whatsapp ?? "",
        email: proveedor.email ?? "",
        direccion: proveedor.direccion ?? "",
        ciudad: proveedor.ciudad ?? "",
        provincia: proveedor.provincia ?? "",
        pais: proveedor.pais ?? "Argentina",
        rubro: proveedor.rubro ?? "",
        estado: proveedor.estado ?? "activo",
        banco: proveedor.banco ?? "",
        alias_cbu: proveedor.alias_cbu ?? "",
        cbu_cvu: proveedor.cbu_cvu ?? "",
        titular_cuenta: proveedor.titular_cuenta ?? "",
        observaciones: proveedor.observaciones ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [proveedor]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.nombre?.trim()) {
        throw new Error("El nombre comercial es obligatorio");
      }

      if (proveedor && proveedor.id) {
        const updateData: UpdateProveedorDto = { ...form };
        await updateProveedor(proveedor.id, updateData);
        toast.success("Proveedor actualizado");
      } else {
        const createData: CreateProveedorDto = { ...form };
        await createProveedor(createData);
        toast.success("Proveedor creado");
      }
      setForm(emptyForm);
      onCreated();
    } catch (error: unknown) {
      let msg = (error as Error).message || "Error al guardar proveedor";
      if (msg.includes("value too long")) {
        msg =
          "Uno de los campos excede la cantidad máxima de caracteres permitidos.";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <div className="col-span-full rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
        El nombre comercial queda como dato principal visible en productos, ventas y reportes. Los datos fiscales, ubicación y banco son opcionales, pero recomendados para compras, reposición y trazabilidad.
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre comercial</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Ej: Suplementos Córdoba"
          value={form.nombre ?? ""}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="razon_social">Razón social</Label>
        <Input
          id="razon_social"
          name="razon_social"
          placeholder="Ej: Suplementos Córdoba S.A."
          value={form.razon_social ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="identificacion_fiscal">CUIT / RUC / identificación fiscal</Label>
        <Input
          id="identificacion_fiscal"
          name="identificacion_fiscal"
          placeholder="Ej: 30-12345678-9"
          value={form.identificacion_fiscal ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="condicion_fiscal">Condición fiscal</Label>
        <Input
          id="condicion_fiscal"
          name="condicion_fiscal"
          placeholder="Ej: Responsable inscripto / Monotributo"
          value={form.condicion_fiscal ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contacto">Contacto principal</Label>
        <Input
          id="contacto"
          name="contacto"
          placeholder="Ej: Laura Gómez"
          value={form.contacto ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rubro">Rubro / categoría</Label>
        <Input
          id="rubro"
          name="rubro"
          placeholder="Ej: Suplementos / Bebidas / Equipamiento"
          value={form.rubro ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          type="tel"
          placeholder="Ej: 351 555 1234"
          value={form.telefono ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          placeholder="Ej: 5493515551234"
          value={form.whatsapp ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Ej: ventas@proveedor.com"
          value={form.email ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="estado">Estado</Label>
        <select
          id="estado"
          name="estado"
          value={form.estado ?? "activo"}
          onChange={handleChange}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {PROVEEDOR_ESTADOS.map((estado) => (
            <option key={estado.value} value={estado.value}>
              {estado.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          name="direccion"
          placeholder="Ingrese dirección comercial"
          value={form.direccion ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ciudad">Ciudad</Label>
        <Input
          id="ciudad"
          name="ciudad"
          placeholder="Ej: Córdoba"
          value={form.ciudad ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="provincia">Provincia</Label>
        <Input
          id="provincia"
          name="provincia"
          placeholder="Ej: Córdoba"
          value={form.provincia ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pais">País</Label>
        <Input
          id="pais"
          name="pais"
          placeholder="Ej: Argentina"
          value={form.pais ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="banco">Banco</Label>
        <Input
          id="banco"
          name="banco"
          placeholder="Ej: Banco Galicia"
          value={form.banco ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="alias_cbu">Alias CBU/CVU</Label>
        <Input
          id="alias_cbu"
          name="alias_cbu"
          placeholder="Ej: proveedor.gym.mp"
          value={form.alias_cbu ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cbu_cvu">CBU/CVU</Label>
        <Input
          id="cbu_cvu"
          name="cbu_cvu"
          placeholder="Ingrese CBU/CVU"
          value={form.cbu_cvu ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="titular_cuenta">Titular de cuenta</Label>
        <Input
          id="titular_cuenta"
          name="titular_cuenta"
          placeholder="Nombre/Razón social titular de la cuenta"
          value={form.titular_cuenta ?? ""}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <textarea
          id="observaciones"
          name="observaciones"
          placeholder="Notas internas, condiciones comerciales, horarios de entrega, etc."
          value={form.observaciones ?? ""}
          onChange={handleChange}
          className="min-h-[88px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="col-span-full flex flex-col justify-end gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={onCancel}
          className="text-gray-800 bg-gray-200 hover:bg-gray-300"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Guardando..."
            : proveedor
            ? "Actualizar Proveedor"
            : "Crear Proveedor"}
        </Button>
      </div>
    </form>
  );
}

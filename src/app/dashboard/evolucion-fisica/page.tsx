"use client";

import { useState } from "react";
import { AppHeader } from "@/components/header/AppHeader";
import { AppFooter } from "@/components/footer/AppFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";

const MOCK_MEDIDAS = [
  { fecha: "2024-01-01", peso: 80, cintura: 90, cadera: 100, altura: 175 },
  { fecha: "2024-02-01", peso: 78, cintura: 88, cadera: 99, altura: 175 },
  { fecha: "2024-03-01", peso: 77, cintura: 87, cadera: 98, altura: 175 },
  { fecha: "2024-04-01", peso: 76, cintura: 86, cadera: 97, altura: 175 },
];

function calcularIMC(peso: number, altura: number) {
  if (!peso || !altura) return 0;
  return +(peso / Math.pow(altura / 100, 2)).toFixed(2);
}

function getIMCStatus(imc: number) {
  if (imc < 18.5) return "Bajo peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidad";
}

export default function EvolucionFisicaPage() {
  const [medidas, setMedidas] = useState(MOCK_MEDIDAS);
  const [form, setForm] = useState({
    fecha: "",
    peso: "",
    cintura: "",
    cadera: "",
    altura: "",
  });

  const ultima = medidas[medidas.length - 1];
  const imc = calcularIMC(Number(ultima.peso), Number(ultima.altura));
  const imcStatus = getIMCStatus(imc);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMedidas([
      ...medidas,
      {
        fecha: form.fecha,
        peso: Number(form.peso),
        cintura: Number(form.cintura),
        cadera: Number(form.cadera),
        altura: Number(form.altura),
      },
    ]);
    setForm({ fecha: "", peso: "", cintura: "", cadera: "", altura: "" });
  };

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <SidebarInset>
          <AppHeader title="Evolución física" />
          <main className="flex-1 p-6 space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader className="text-xl font-bold">
                  Registrar medidas
                </CardHeader>
                <CardContent>
                  <form
                    className="grid grid-cols-2 gap-4"
                    onSubmit={handleSubmit}
                  >
                    <Input
                      name="fecha"
                      type="date"
                      value={form.fecha}
                      onChange={handleChange}
                      required
                      placeholder="Fecha"
                    />
                    <Input
                      name="peso"
                      type="number"
                      value={form.peso}
                      onChange={handleChange}
                      required
                      placeholder="Peso (kg)"
                    />
                    <Input
                      name="cintura"
                      type="number"
                      value={form.cintura}
                      onChange={handleChange}
                      required
                      placeholder="Cintura (cm)"
                    />
                    <Input
                      name="cadera"
                      type="number"
                      value={form.cadera}
                      onChange={handleChange}
                      required
                      placeholder="Cadera (cm)"
                    />
                    <Input
                      name="altura"
                      type="number"
                      value={form.altura}
                      onChange={handleChange}
                      required
                      placeholder="Altura (cm)"
                    />
                    <div className="flex justify-end col-span-2">
                      <Button type="submit">Agregar</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <Card className="flex flex-col items-center justify-center gap-4 p-4">
                <div className="flex items-center justify-center h-40 rounded w-28 bg-muted">
                  <img
                    src="/male_silhouette.svg"
                    alt="male"
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="flex items-center justify-center h-40 rounded w-28 bg-muted">
                  <img
                    src="/female_silhouette.svg"
                    alt="female"
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="mt-2 text-center">
                  <div className="font-bold">IMC actual</div>
                  <div className="text-2xl font-bold text-[#02a8e1]">{imc}</div>
                  <div className="mt-1 text-sm">{imcStatus}</div>
                </div>
              </Card>
            </div>
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader className="text-xl font-bold">
                Historial de medidas
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border rounded-md">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Peso (kg)</th>
                        <th className="px-3 py-2">Cintura (cm)</th>
                        <th className="px-3 py-2">Cadera (cm)</th>
                        <th className="px-3 py-2">Altura (cm)</th>
                        <th className="px-3 py-2">IMC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medidas.map((m, i) => (
                        <tr key={i} className="odd:bg-muted/40">
                          <td className="px-3 py-2">{m.fecha}</td>
                          <td className="px-3 py-2">{m.peso}</td>
                          <td className="px-3 py-2">{m.cintura}</td>
                          <td className="px-3 py-2">{m.cadera}</td>
                          <td className="px-3 py-2">{m.altura}</td>
                          <td className="px-3 py-2">
                            {calcularIMC(m.peso, m.altura)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </main>
          <AppFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

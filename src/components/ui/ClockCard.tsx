"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatFecha(d: Date) {
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}

export default function ClockCard() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  return (
    <Card className="w-full mt-4 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-muted-foreground">
          Hora actual
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        {/* Logo a la izquierda */}
        <div className="flex items-center gap-2">
          {/* coloca gm_logo.png en /public */}
          <Image
            src="gm_logo.svg"
            alt="Gym Master"
            width={48}
            height={48}
            className="rounded"
            priority
          />
          
        </div>

        {/* Hora grande + fecha */}
        <div className="flex items-end gap-6">
          <div className="text-5xl font-semibold leading-none tabular-nums">
            {hh}:{mm}:{ss}
          </div>
          <div className="text-right text-sm sm:text-base text-muted-foreground">
            {formatFecha(now)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SwaggerPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="border-b bg-slate-950 px-6 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
          Gym Master API
        </p>
        <h1 className="mt-1 text-2xl font-bold">Swagger / OpenAPI</h1>
        <p className="mt-1 max-w-5xl text-sm text-slate-200">
          Documentación completa de endpoints detectados en el repositorio. Cada
          API nueva o modificada debe actualizar esta especificación con
          descripción, payloads, respuestas y ejemplos.
        </p>
      </div>

      <SwaggerUI
        url="/api/swagger-json"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={2}
        displayRequestDuration
        filter
        showExtensions
        tryItOutEnabled
      />
    </main>
  );
}

'use client';

import { useState } from 'react';
import BienvenidaSocio from '@/components/ui/BienvenidaSocio';

export default function PruebaBienvenida() {
  const [showWelcome, setShowWelcome] = useState(false);

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Prueba del componente BienvenidaSocio</h1>
      
      <button
        onClick={() => setShowWelcome(true)}
        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        Mostrar Bienvenida
      </button>

      {showWelcome && (
        <BienvenidaSocio

        />
      )}
    </div>
  );
}
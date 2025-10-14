'use client';

import RankingAsistenciaTable from '@/components/ranking-asistencia/RankingAsistenciaTable';

export default function RankingAsistenciaPage() {
  return (
    <div className='p-6'>
      <h1 className='mb-4 text-2xl font-bold'>Ranking de Asistencia</h1>
      <RankingAsistenciaTable />
    </div>
  );
}

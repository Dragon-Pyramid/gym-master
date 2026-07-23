'use client';

import RankingAsistenciaTable from '@/components/ranking-asistencia/RankingAsistenciaTable';
import { useI18n } from '@/i18n/I18nProvider';

export default function RankingAsistenciaPage() {
  const { t } = useI18n();

  return (
    <div className='p-6'>
      <h1 className='mb-4 text-2xl font-bold'>
        {t('publicPages.attendanceRanking.title')}
      </h1>
      <RankingAsistenciaTable />
    </div>
  );
}

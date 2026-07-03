'use client';
import React, { useState } from 'react';
import { ClipboardList, FilePlus2, History } from 'lucide-react';
import TabActual from './TabActual';
import TabNueva from './TabNueva';
import TabHistorial from './TabHistorial';

type TabKey = 'actual' | 'nueva' | 'historial';

type TabsProps = {
  socioId?: number | string;
  socioLabel?: string;
  socioEmail?: string | null;
  isAdminReview?: boolean;
};

export default function Tabs({
  socioId,
  socioLabel,
  socioEmail,
  isAdminReview = false,
}: TabsProps) {
  const [active, setActive] = useState<TabKey>('actual');

  const tabs: { key: TabKey; label: string; helper: string; icon: React.ReactNode }[] = [
    {
      key: 'actual',
      label: 'Actual',
      helper: 'Datos vigentes',
      icon: <ClipboardList className='h-4 w-4' aria-hidden />,
    },
    {
      key: 'nueva',
      label: 'Nueva',
      helper: 'Registrar control',
      icon: <FilePlus2 className='h-4 w-4' aria-hidden />,
    },
    {
      key: 'historial',
      label: 'Historial',
      helper: 'Controles previos',
      icon: <History className='h-4 w-4' aria-hidden />,
    },
  ];

  return (
    <div className='w-full'>
      <div className='w-full overflow-hidden rounded-2xl border bg-background shadow-sm dark:border-slate-800 dark:bg-slate-950/90'>
        <div className='border-b bg-muted/30 px-3 py-3 dark:bg-slate-900/70 sm:px-4'>
          <nav
            className='grid w-full grid-cols-1 gap-2 sm:grid-cols-3'
            role='tablist'
            aria-label='Pestañas ficha médica'
          >
            {tabs.map((tab) => {
              const isActive = tab.key === active;
              return (
                <button
                  key={tab.key}
                  role='tab'
                  type='button'
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.key}`}
                  onClick={() => setActive(tab.key)}
                  className={`flex min-h-[58px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'border-emerald-300 bg-emerald-600 text-white shadow-sm dark:border-emerald-500 dark:bg-emerald-500/25 dark:text-emerald-50'
                      : 'border-transparent bg-background text-foreground hover:border-emerald-200 hover:bg-emerald-50 dark:bg-slate-950 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isActive ? 'bg-white/15' : 'bg-muted'}`}>
                    {tab.icon}
                  </span>
                  <span className='min-w-0'>
                    <span className='block text-sm font-black'>{tab.label}</span>
                    <span className={`block truncate text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {tab.helper}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className='w-full p-3 sm:p-4 lg:p-5'>
          <div id='panel-actual' role='tabpanel' hidden={active !== 'actual'}>
            <TabActual
              socioId={socioId}
              active={active === 'actual'}
              socioLabel={socioLabel}
              socioEmail={socioEmail}
              isAdminReview={isAdminReview}
            />
          </div>
          <div id='panel-nueva' role='tabpanel' hidden={active !== 'nueva'}>
            <TabNueva socioId={socioId} onSaved={() => setActive('actual')} />
          </div>
          <div
            id='panel-historial'
            role='tabpanel'
            hidden={active !== 'historial'}
          >
            <TabHistorial
              socioId={socioId}
              active={active === 'historial'}
              socioLabel={socioLabel}
              isAdminReview={isAdminReview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

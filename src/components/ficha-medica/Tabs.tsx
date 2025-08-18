'use client';
import React, { useState } from 'react';
import TabActual from './TabActual';
import TabNueva from './TabNueva';
import TabHistorial from './TabHistorial';

type TabKey = 'actual' | 'nueva' | 'historial';

export default function Tabs({ socioId }: { socioId?: number | string }) {
  const [active, setActive] = useState<TabKey>('actual');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: 'actual',
      label: 'Actual',
      icon: (
        <svg
          className='w-4 h-4'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden
        >
          <path
            d='M12 2v6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M12 22v-6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M2 12h6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M22 12h-6'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
    {
      key: 'nueva',
      label: 'Nueva',
      icon: (
        <svg
          className='w-4 h-4'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden
        >
          <path
            d='M12 5v14'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M5 12h14'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
    {
      key: 'historial',
      label: 'Historial',
      icon: (
        <svg
          className='w-4 h-4'
          viewBox='0 0 24 24'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden
        >
          <path
            d='M21 12a9 9 0 11-3-6.7'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M12 7v5l3 3'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
    },
  ];

  return (
    <div className='w-full'>
      <div className='w-full overflow-hidden border shadow-sm page-bg rounded-xl'>
        <div className='px-4 py-3'>
          <div className='flex items-center'>
            <nav
              className='flex flex-wrap w-full gap-2'
              role='tablist'
              aria-label='Pestañas ficha médica'
            >
              {tabs.map((t) => {
                const isActive = t.key === active;
                return (
                  <button
                    key={t.key}
                    role='tab'
                    aria-selected={isActive}
                    aria-controls={`panel-${t.key}`}
                    onClick={() => setActive(t.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors focus:outline-none flex-1 min-w-[120px] justify-center ${
                      isActive ? 'is-active' : 'is-inactive'
                    }`}
                  >
                    <span className='opacity-90'>{t.icon}</span>
                    <span className='text-sm font-medium'>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        <div className='w-full px-4 py-6 border-t'>
          <div id='panel-actual' role='tabpanel' hidden={active !== 'actual'}>
            <TabActual socioId={socioId} active={active === 'actual'} />
          </div>
          <div id='panel-nueva' role='tabpanel' hidden={active !== 'nueva'}>
            <TabNueva socioId={socioId} onSaved={() => setActive('actual')} />
          </div>
          <div
            id='panel-historial'
            role='tabpanel'
            hidden={active !== 'historial'}
          >
            <TabHistorial socioId={socioId} active={active === 'historial'} />
          </div>
        </div>
      </div>
    </div>
  );
}

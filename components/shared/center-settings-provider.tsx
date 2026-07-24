'use client';

import React, { createContext, useContext } from 'react';
import type { CenterBranding } from '@/actions/settings/settings';

const defaultBranding: CenterBranding = {
  teacherName: '',
  centerNameAr: 'My Center',
  centerNameEn: 'My Center',
  centerName: 'My Center',
  centerLogo: '',
  centerAddress: '',
  centerPhone: '',
  centerEmail: '',
  centerWebsite: '',
  centerDescription: '',
  favicon: '',
};

const CenterSettingsContext = createContext<CenterBranding>(defaultBranding);

export function CenterSettingsProvider({
  settings,
  children,
}: {
  settings: CenterBranding;
  children: React.ReactNode;
}) {
  return (
    <CenterSettingsContext.Provider value={settings || defaultBranding}>
      {children}
    </CenterSettingsContext.Provider>
  );
}

export function useCenterSettings(): CenterBranding {
  const context = useContext(CenterSettingsContext);
  return context || defaultBranding;
}

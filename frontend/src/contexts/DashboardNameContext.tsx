import React, { createContext, useContext, useState, useCallback } from 'react';

interface DashboardNameContextValue {
  dashboardName: string | null;
  setDashboardName: (name: string | null) => void;
}

const DashboardNameContext = createContext<DashboardNameContextValue | undefined>(undefined);

export function DashboardNameProvider({ children }: { children: React.ReactNode }) {
  const [dashboardName, setDashboardNameState] = useState<string | null>(null);

  const setDashboardName = useCallback((name: string | null) => {
    setDashboardNameState(name);
  }, []);

  return (
    <DashboardNameContext.Provider value={{ dashboardName, setDashboardName }}>
      {children}
    </DashboardNameContext.Provider>
  );
}

export function useDashboardName() {
  const context = useContext(DashboardNameContext);
  if (!context) {
    throw new Error('useDashboardName must be used within DashboardNameProvider');
  }
  return context;
}

// @TASK P1-S0-T2 - CoupleContext + CoupleProvider + useCouple
// @SPEC docs/planning/06-tasks.md#P1-S0-T2
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import type { Couple } from '../types';

interface CoupleContextValue {
  couple: Couple | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

const COUPLE_ID = 'cpl_sample_001';

interface CoupleProviderProps {
  children: ReactNode;
}

export function CoupleProvider({ children }: CoupleProviderProps) {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Couple>(`/couples/${COUPLE_ID}`);
      setCouple(res.data);
    } catch (err) {
      const e = err as { message?: string };
      setError(e.message ?? '커플 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    api
      .get<Couple>(`/couples/${COUPLE_ID}`)
      .then((res) => {
        if (!cancelled) {
          setCouple(res.data);
          setLoading(false);
        }
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) {
          setError(err.message ?? '커플 정보를 불러올 수 없습니다.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CoupleContext.Provider value={{ couple, loading, error, refetch }}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple(): CoupleContextValue {
  const ctx = useContext(CoupleContext);
  if (ctx === null) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return ctx;
}

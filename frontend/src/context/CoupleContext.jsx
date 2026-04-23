// @TASK P1-S0-T2 - CoupleContext + CoupleProvider + useCouple
// @SPEC docs/planning/06-tasks.md#P1-S0-T2
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CoupleContext = createContext(null);

const COUPLE_ID = 'cpl_sample_001';

export function CoupleProvider({ children }) {
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/couples/${COUPLE_ID}`)
      .then((res) => {
        if (!cancelled) {
          setCouple(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
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
    <CoupleContext.Provider value={{ couple, loading, error }}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const ctx = useContext(CoupleContext);
  if (ctx === null) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return ctx;
}

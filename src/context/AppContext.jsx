import { createContext, useContext, useState, useCallback } from 'react';
import { loadState, saveState, recalcDay } from '../store';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadState());

  const updateState = useCallback((updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  }, []);

  const setProfile = useCallback((profile) => {
    updateState(prev => ({ ...prev, profile }));
  }, [updateState]);

  const saveCowEntry = useCallback((dk, cowData) => {
    updateState(prev => {
      const records = recalcDay({
        ...prev.records,
        [dk]: { ...(prev.records[dk] || {}), cow: { ...cowData, saved: true }, date: dk }
      }, dk);
      return { ...prev, records };
    });
  }, [updateState]);

  const saveCalfEntry = useCallback((dk, calfData) => {
    updateState(prev => {
      const records = recalcDay({
        ...prev.records,
        [dk]: { ...(prev.records[dk] || {}), calf: { ...calfData, saved: true }, date: dk }
      }, dk);
      return { ...prev, records };
    });
  }, [updateState]);

  const updatePrices = useCallback((prices) => {
    updateState(prev => ({ ...prev, profile: { ...prev.profile, prices } }));
  }, [updateState]);

  const updateAnimals = useCallback((animals) => {
    updateState(prev => ({ ...prev, profile: { ...prev.profile, ...animals } }));
  }, [updateState]);

  const importData = useCallback((data) => {
    updateState(data);
  }, [updateState]);

  const resetData = useCallback(() => {
    const fresh = { profile: null, records: {} };
    saveState(fresh);
    setState(fresh);
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      setProfile,
      saveCowEntry,
      saveCalfEntry,
      updatePrices,
      updateAnimals,
      importData,
      resetData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

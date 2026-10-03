import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loadState, saveState, recalcDay } from '../store';
import {
  makeAccountKey,
  getActiveAccountKey,
  setActiveAccountKey,
  loadLocalState,
  saveLocalState,
  fetchRemoteState,
  pushRemoteState,
} from '../cloudSync';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    const activeKey = getActiveAccountKey();
    if (activeKey) {
      const local = loadLocalState(activeKey);
      if (local && local.profile) return local;
    }
    return loadState();
  });

  // Background sync on mount if active key exists
  useEffect(() => {
    const activeKey =
      getActiveAccountKey() ||
      (state.profile
        ? makeAccountKey(state.profile.farmName, state.profile.ownerName, state.profile.password)
        : null);

    if (activeKey) {
      setActiveAccountKey(activeKey);
      fetchRemoteState(activeKey).then(remote => {
        if (remote && remote.profile) {
          setState(remote);
        }
      });
    }
  }, []);

  const updateState = useCallback((updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const accKey =
        getActiveAccountKey() ||
        (next.profile
          ? makeAccountKey(next.profile.farmName, next.profile.ownerName, next.profile.password)
          : null);

      saveState(next);
      if (accKey) {
        saveLocalState(accKey, next);
        pushRemoteState(accKey, next);
      }
      return next;
    });
  }, []);

  // Login/Sync with Farm Name + Owner Name + Password
  const loginOrSyncAccount = useCallback(async (farmName, ownerName, password) => {
    const accKey = makeAccountKey(farmName, ownerName, password);
    if (!accKey) return { success: false, message: 'कृपया फार्मचे नाव, मालकाचे नाव व पासवर्ड अचूक भरा.' };

    setActiveAccountKey(accKey);

    // 1. Try local cached state for this account key first
    const local = loadLocalState(accKey);
    if (local && local.profile && local.profile.farmName) {
      setState(local);
      saveState(local);
      // Also sync latest in background
      fetchRemoteState(accKey).then(remote => {
        if (remote && remote.profile) setState(remote);
      });
      return { success: true, isNew: false, state: local };
    }

    // 2. Try fetching from online cloud sync
    const remote = await fetchRemoteState(accKey);
    if (remote && remote.profile && remote.profile.farmName) {
      setState(remote);
      saveState(remote);
      return { success: true, isNew: false, state: remote };
    }

    // 3. New account with these credentials
    return { success: true, isNew: true, accountKey: accKey };
  }, []);

  const setProfile = useCallback((profile) => {
    updateState(prev => {
      const accKey = makeAccountKey(profile.farmName, profile.ownerName, profile.password);
      if (accKey) setActiveAccountKey(accKey);
      return { ...prev, profile };
    });
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

  const logout = useCallback(() => {
    setActiveAccountKey(null);
    const fresh = { profile: null, records: {} };
    saveState(fresh);
    setState(fresh);
  }, []);

  const resetData = useCallback(() => {
    const fresh = { profile: null, records: {} };
    setActiveAccountKey(null);
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
      logout,
      resetData,
      loginOrSyncAccount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { load, Store } from '@tauri-apps/plugin-store';
import React, { createContext, useContext, useState, useEffect } from 'react';
// when using `"withGlobalTauri": true`, you may use
// const { load } = window.__TAURI__.store;

type AppStore = {
  baseFolder: string | null;
  cache: Record<string, any>;
};

// create a react context to use the store
interface StoreContextType {
  setStoreValue: (key: string, value: any) => Promise<void>;
  getStoreValue: <T>(key: string) => Promise<T | null>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<React.PropsWithChildren> = ({ children }: React.PropsWithChildren) => {
  const [storeState, setStoreState] = useState<AppStore>({ baseFolder: null, cache: {} });
  const [persistedStore, setPersistedStore] = useState<Store | null>(null);

  useEffect(() => {
    const initializeStore = async () => {
      const loadedStore = await load('store.json', { autoSave: true });
      setPersistedStore(loadedStore);
    };
    initializeStore();
  }, []);

  const setStoreValue = async (key: string, value: any) => {
    if (persistedStore) {
      await persistedStore.set(key, value);
    }
    setStoreState((prevState) => ({ ...prevState, [key]: value }));
  };

  const getStoreValue = async <T,>(key: string): Promise<T | null> => {
    const cachedValue = storeState[key];
    if (!cachedValue && persistedStore) {
      return await persistedStore.get<T>(key);
    }
    return cachedValue;
  };

  return <StoreContext.Provider value={{ setStoreValue, getStoreValue }}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

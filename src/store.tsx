/* eslint-disable @typescript-eslint/no-explicit-any */
import { load, Store } from '@tauri-apps/plugin-store';
import { Preferences } from '@capacitor/preferences';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { isTauri, isCapacitor } from './services/platform';
// when using `"withGlobalTauri": true`, you may use
// const { load } = window.__TAURI__.store;

type NotePageCache = {
  lastViewedPage: number;
  pages: Record<string, { pageNumber: string; index: number; marksCount: number }>;
};

type AppStore = {
  baseFolder: string | null;
  currentPath: string[];
  currentFile: string | null;
  cache: Record<string, any>;
  fileCacheInfo: Record<string, NotePageCache>;
};

// create a react context to use the store
interface StoreContextType {
  store: AppStore;
  setStoreValue: (key: string, value: any) => Promise<void>;
  removeData: (key: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Load Data
export async function loadData(keys: string[]): Promise<any> {
  if (isTauri) {
    const store = await load('store.json', { autoSave: true });
    return await Promise.all(keys.map((key) => store.get(key)));
  } else if (isCapacitor) {
    const results = await Promise.all(keys.map((key) => Preferences.get({ key })));
    return results.reduce((store, result, i) => {
      const data = result.value ? JSON.parse(result.value) : null;
      store[keys[i]] = data;
      return store;
    }, {});
  }
  return null;
}

export const StoreProvider: React.FC<React.PropsWithChildren> = ({ children }: React.PropsWithChildren) => {
  const [storeState, setStoreState] = useState<AppStore>({
    baseFolder: null,
    cache: {},
    currentPath: [],
    currentFile: null,
    fileCacheInfo: {},
  });
  const [tauriStore, setTauriStore] = useState<Store | null>(null);

  async function loadData(keys: string[]): Promise<any> {
    if (isTauri) {
      console.log('Loading data from Tauri store');
      const store = await load('store.json', { autoSave: true });
      setTauriStore(store);
      const results = await Promise.all(keys.map((key) => store.get(key)));
      return results.reduce((store, result, i) => {
        store[keys[i]] = result;
        return store;
      }, {});
    } else if (isCapacitor) {
      console.log('Loading data from Capacitor store');
      const results = await Promise.all(keys.map((key) => Preferences.get({ key })));
      return results.reduce((store, result, i) => {
        const data = result.value ? JSON.parse(result.value) : null;
        store[keys[i]] = data;
        return store;
      }, {});
    }
    return null;
  }

  useEffect(() => {
    const initializeStore = async () => {
      const loadedStore = await loadData(['baseFolder', 'cache']);
      loadedStore['cache'] = loadedStore['cache'] || {};
      console.log('Loaded store', loadedStore);
      setStoreState((prevState) => ({ ...prevState, ...loadedStore }));
    };
    initializeStore();
  }, []);

  const setStoreValue = async (key: string, value: any) => {
    if (isTauri && tauriStore) {
      console.log('Setting data in Tauri store');
      await tauriStore.set(key, value);
      await tauriStore.save(); // Persist data
    } else if (isCapacitor) {
      console.log('Setting data in Capacitor store');
      await Preferences.set({ key, value: JSON.stringify(value) });
    }
    setStoreState((prevState) => ({ ...prevState, [key]: value }));
  };

  // Remove Data
  const removeData = async (key: string) => {
    if (isTauri && tauriStore) {
      await tauriStore.delete(key);
      await tauriStore.save();
    } else if (isCapacitor) {
      await Preferences.remove({ key });
    }
  };

  return (
    <StoreContext.Provider value={{ store: storeState, setStoreValue, removeData }}>{children}</StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

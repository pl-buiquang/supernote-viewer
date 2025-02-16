/* eslint-disable @typescript-eslint/no-explicit-any */
import { load, Store } from '@tauri-apps/plugin-store';
import { Preferences } from '@capacitor/preferences';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { isTauri, isCapacitor } from './services/platform';
// when using `"withGlobalTauri": true`, you may use
// const { load } = window.__TAURI__.store;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type NotePageExtractInfo<T = {}> = {
  pageNumber: string;
  index: number;
  marksCount: number;
} & T;

export type NotePageCache = {
  lastViewedPage: number;
  pages: NotePageExtractInfo[];
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
  updateCache: (key: string, value: any) => Promise<void>;
  updateFileCacheInfo: (key: string, value: any) => Promise<void>;
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
      const loadedStore = await loadData(['baseFolder', 'cache', 'fileCacheInfo']);
      loadedStore['cache'] = loadedStore['cache'] || {};
      loadedStore['fileCacheInfo'] = loadedStore['fileCacheInfo'] || {};
      console.log('Loaded store', loadedStore);
      setStoreState((prevState) => ({ ...prevState, ...loadedStore }));
    };
    initializeStore();
  }, []);

  useEffect(() => {
    async function saveData() {
      await Promise.all(
        Object.entries(storeState).map(async ([key, value]) => {
          if (isTauri && tauriStore) {
            console.log('Setting data in Tauri store');
            await tauriStore.set(key, value);
          } else if (isCapacitor) {
            console.log('Setting data in Capacitor store');
            await Preferences.set({ key, value: JSON.stringify(value) });
          }
        }),
      );
      if (isTauri && tauriStore) {
        await tauriStore.save();
      }
    }
    saveData();
  }, [storeState]);

  const setStoreValue = async (key: string, value: any) => {
    setStoreState((prevState) => ({ ...prevState, [key]: value }));
  };

  const updateCache = async (key: string, value: any) => {
    setStoreState((prevState) => ({ ...prevState, cache: { ...prevState.cache, [key]: value } }));
  };

  const updateFileCacheInfo = async (key: string, value: any) => {
    setStoreState((prevState) => ({ ...prevState, fileCacheInfo: { ...prevState.fileCacheInfo, [key]: value } }));
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
    <StoreContext.Provider value={{ store: storeState, setStoreValue, removeData, updateCache, updateFileCacheInfo }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

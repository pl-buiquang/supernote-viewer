/* eslint-disable @typescript-eslint/no-explicit-any */
import { load, Store } from '@tauri-apps/plugin-store';
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  fileScrollPosition: Record<string, number>;
};

// create a react context to use the store
interface StoreContextType {
  store: AppStore;
  setStoreValue: (key: string, value: any) => Promise<void>;
  updateCache: (key: string, value: any) => Promise<void>;
  updateFileCacheInfo: (key: string, value: any) => Promise<void>;
  updateFileScrollPosition: (key: string, value: number) => Promise<void>;
  updateLastViewedPage: (key: string, value: number) => Promise<void>;
  removeData: (key: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Load Data
export async function loadData(keys: string[]): Promise<any> {
  const store = await load('store.json', { autoSave: true });
  return await Promise.all(keys.map((key) => store.get(key)));
}

type StoreProviderProps = {
  initialFile: string | null;
};

export const StoreProvider: React.FC<React.PropsWithChildren<StoreProviderProps>> = ({
  initialFile,
  children,
}: React.PropsWithChildren<StoreProviderProps>) => {
  const [storeState, setStoreState] = useState<AppStore>({
    baseFolder: null,
    cache: {},
    currentPath: [],
    currentFile: null,
    fileCacheInfo: {},
    fileScrollPosition: {},
  });
  const [tauriStore, setTauriStore] = useState<Store | null>(null);

  async function loadData(keys: string[]): Promise<any> {
    console.log('Loading data from Tauri store');
    const store = await load('store.json', { autoSave: true });
    setTauriStore(store);
    const results = await Promise.all(keys.map((key) => store.get(key)));
    return results.reduce((store, result, i) => {
      store[keys[i]] = result;
      return store;
    }, {});
  }

  useEffect(() => {
    const initializeStore = async () => {
      const loadedStore = await loadData(['baseFolder', 'cache', 'fileCacheInfo', 'fileScrollPosition']);
      loadedStore['cache'] = loadedStore['cache'] || {};
      loadedStore['fileCacheInfo'] = loadedStore['fileCacheInfo'] || {};
      loadedStore['fileScrollPosition'] = loadedStore['fileScrollPosition'] || {};
      console.log('Loaded store', loadedStore);
      setStoreState((prevState) => ({ ...prevState, ...loadedStore }));
    };
    initializeStore();
  }, []);

  useEffect(() => {
    if (initialFile) {
      setStoreState((prevState) => ({ ...prevState, currentFile: initialFile }));
    }
  }, [initialFile]);

  useEffect(() => {
    async function saveData() {
      await Promise.all(
        Object.entries(storeState).map(async ([key, value]) => {
          if (tauriStore) {
            console.log('Setting data in Tauri store');
            await tauriStore.set(key, value);
          }
        }),
      );
      if (tauriStore) {
        await tauriStore.save();
      }
    }
    saveData();
  }, [storeState]);

  const setStoreValue = async (key: string, value: any) => {
    console.log('Setting store value', key, value);
    setStoreState((prevState) => ({ ...prevState, [key]: value }));
  };

  const updateCache = async (key: string, value: any) => {
    console.log('Updating cache', key, value);
    setStoreState((prevState) => ({ ...prevState, cache: { ...prevState.cache, [key]: value } }));
  };

  const updateFileCacheInfo = async (key: string, value: any) => {
    console.log('Updating file cache info', key, value);
    setStoreState((prevState) => ({ ...prevState, fileCacheInfo: { ...prevState.fileCacheInfo, [key]: value } }));
  };

  const updateFileScrollPosition = async (key: string, value: number) => {
    console.log('Updating file scroll position', key, value);
    setStoreState((prevState) => ({
      ...prevState,
      fileScrollPosition: { ...prevState.fileScrollPosition, [key]: value },
    }));
  };

  const updateLastViewedPage = async (key: string, value: number) => {
    console.log('Updating last viewed page', key, value);
    setStoreState((prevState) => ({
      ...prevState,
      fileCacheInfo: {
        ...prevState.fileCacheInfo,
        [key]: { pages: prevState.fileCacheInfo[key]?.pages, lastViewedPage: value },
      },
    }));
  };

  // Remove Data
  const removeData = async (key: string) => {
    if (tauriStore) {
      await tauriStore.delete(key);
      await tauriStore.save();
    }
  };

  return (
    <StoreContext.Provider
      value={{
        store: storeState,
        setStoreValue,
        removeData,
        updateCache,
        updateFileCacheInfo,
        updateFileScrollPosition,
        updateLastViewedPage,
      }}
    >
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

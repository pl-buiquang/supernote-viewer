import { useStore } from '@/store';
import { v4 as uuidv4 } from 'uuid';
import { createDir, exists as fileExists } from '@/services/platform';
import { useEffect } from 'react';

const CACHE_DIR = 'cache';

const useCache = () => {
  const { store, setStoreValue } = useStore();

  useEffect(() => {
    const initAppCacheDir = async () => {
      const cacheDirExist = await fileExists(CACHE_DIR, true);
      if (!cacheDirExist) {
        await createDir(CACHE_DIR);
      }
    };
    initAppCacheDir();
  }, []);

  const getCachedFile = async (filepath: string) => {
    if (!store.cache[filepath]) {
      const uuid = uuidv4();
      const cachePath = `${CACHE_DIR}/${uuid}`;
      console.log('Caching file', filepath, 'to', cachePath);
      await setStoreValue('cache', { ...store.cache, [filepath]: cachePath });
      return cachePath;
    } else {
      return store.cache[filepath];
    }
  };

  const exists = async (filepath: string) => {
    console.log('Checking if file exists in cache', filepath);
    const cachedPath = store.cache[filepath];
    if (!cachedPath) return false;
    return await fileExists(cachedPath, true);
  };

  return { getCachedFile, exists };
};

export default useCache;

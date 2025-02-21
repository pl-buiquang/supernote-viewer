import { useStore } from '@/store';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';
import useAppLogger from './useAppLogger';
import usePlatform from './usePlatform';

const CACHE_DIR = 'cache';

const useCache = () => {
  const { logInfo } = useAppLogger('cache');
  const { store, updateCache, updateFileCacheInfo } = useStore();
  const platform = usePlatform();

  useEffect(() => {
    const initAppCacheDir = async () => {
      const cacheDirExist = await platform.exists(CACHE_DIR, true);
      if (!cacheDirExist) {
        await platform.createDir(CACHE_DIR);
      }
    };
    initAppCacheDir();
  }, []);

  const getCachedFile = async (filepath: string) => {
    if (!store.cache[filepath]) {
      const uuid = uuidv4();
      const cachePath = `${CACHE_DIR}/${uuid}`;
      logInfo('Caching file', filepath, 'to', cachePath);
      await updateCache(filepath, cachePath);
      return cachePath;
    } else {
      return store.cache[filepath];
    }
  };

  const exists = async (filepath: string) => {
    logInfo('Checking if file exists in cache', filepath);
    const cachedPath = store.cache[filepath];
    if (!cachedPath) return false;
    return await platform.exists(cachedPath, true);
  };

  const deleteCache = async (filepath: string) => {
    logInfo('Deleting cache for', filepath);
    const cachedPath = store.cache[filepath];
    if (cachedPath) {
      logInfo('Deleting file cache for', filepath);
      await platform.deleteFile(cachedPath, true);
      await updateCache(filepath, null);
    }
    const fileCacheInfo = store.fileCacheInfo[filepath];
    if (fileCacheInfo) {
      const { pages } = fileCacheInfo;
      if (pages) {
        for (const page of pages) {
          const imageCachePath = filepath + page.pageNumber;
          const cachedImagePath = store.cache[imageCachePath];
          logInfo('Deleting file cache for', imageCachePath);
          if (cachedImagePath) {
            await platform.deleteFile(cachedImagePath, true);
            await updateCache(imageCachePath, null);
          }
        }
      }
      logInfo('Deleting cache info for', filepath);
      await updateFileCacheInfo(filepath, null);
    }
  };

  const clearCache = async () => {
    logInfo('Clearing cache');
    for (const key in store.cache) {
      await deleteCache(key);
    }
    for (const key in store.fileCacheInfo) {
      await deleteCache(key);
    }
  };

  return { getCachedFile, exists, deleteCache, clearCache };
};

export default useCache;

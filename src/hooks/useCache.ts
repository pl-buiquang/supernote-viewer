import { useStore } from '@/store';
import { v4 as uuidv4 } from 'uuid';
import { createDir, deleteFile, exists as fileExists } from '@/services/platform';
import { useEffect } from 'react';

const CACHE_DIR = 'cache';

const useCache = () => {
  const { store, updateCache, updateFileCacheInfo } = useStore();

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
      await updateCache(filepath, cachePath);
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

  const deleteCache = async (filepath: string) => {
    console.log('Deleting cache for', filepath);
    const cachedPath = store.cache[filepath];
    if (cachedPath) {
      console.log('Deleting file cache for', filepath);
      await deleteFile(cachedPath, true);
      await updateCache(filepath, null);
    }
    const fileCacheInfo = store.fileCacheInfo[filepath];
    if (fileCacheInfo) {
      const { pages } = fileCacheInfo;
      if (pages) {
        for (const page of pages) {
          const imageCachePath = filepath + page.pageNumber;
          const cachedImagePath = store.cache[imageCachePath];
          console.log('Deleting file cache for', imageCachePath);
          if (cachedImagePath) {
            await deleteFile(cachedImagePath, true);
            await updateCache(imageCachePath, null);
          }
        }
      }
      console.log('Deleting cache info for', filepath);
      await updateFileCacheInfo(filepath, null);
    }
  };

  return { getCachedFile, exists, deleteCache };
};

export default useCache;

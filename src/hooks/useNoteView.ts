import { exportNote } from '@/services/noteViewer';
import { useStore } from '@/store';
import { useEffect, useState } from 'react';
import useCache from './useCache';
import useAppLogger from './useAppLogger';
import { SupernoteX } from 'supernote-typescript';
import usePlatform from './usePlatform';

export default function useNoteView() {
  const { store, updateFileCacheInfo } = useStore();
  const { logInfo, logWarn, logDebug, logError } = useAppLogger('note-viewer');
  const platform = usePlatform();
  const { getCachedFile } = useCache();
  const [notePath, setNotePath] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(null);
  const [note, setNote] = useState<SupernoteX>(null);

  const arrayBufferToDataUrl = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    // Step 1: Convert ArrayBuffer to Blob
    const blob = new Blob([arrayBuffer], { type: 'image/png' });

    // Step 2: Use FileReader to read the Blob as a data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    (async () => {
      if (notePath) {
        logInfo('Extracting note', notePath);
        const previousExtractInfo = store.fileCacheInfo[notePath];
        logInfo('Previous extract info', previousExtractInfo);
        const { note, images, extractInfo } = await exportNote(platform, notePath, previousExtractInfo, {
          logInfo,
          logWarn,
          logDebug,
          logError,
        });
        await updateFileCacheInfo(notePath, {
          pages: extractInfo.map((info) => ({
            index: info.index,
            pageNumber: info.pageNumber,
            marksCount: info.marksCount,
          })),
          lastViewedPage: 0,
        });
        logInfo('Combining newly extracted images with cached ones');
        const allImages = await Promise.all(
          extractInfo.map(async (page) => {
            const imageCachePath = notePath + page.pageNumber;
            const cachePath = await getCachedFile(imageCachePath);
            if (page.imageIndex !== undefined) {
              const image = images[page.imageIndex];
              await platform.writeFile(cachePath, image.toBuffer());
              return image.toDataURL();
            } else {
              const image = await platform.readFile(cachePath, true);
              return await arrayBufferToDataUrl(image);
            }
          }),
        );
        setImages(allImages);
        setNote(note);
      }
    })();
  }, [notePath]);

  return { setNotePath, images, note };
}

import { exportNote } from '@/services/noteViewer';
import { useStore } from '@/store';
import { useEffect, useState } from 'react';
import useCache from './useCache';
import { readFile, writeFile } from '@/services/platform';
import useAppLogger from './useAppLogger';

export default function useNoteView() {
  const { store, updateFileCacheInfo } = useStore();
  const { logInfo } = useAppLogger('note-viewer');
  const { getCachedFile } = useCache();
  const [notePath, setNotePath] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(null);

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
        const { images, extractInfo } = await exportNote(notePath, previousExtractInfo, (msg: string) => logInfo(msg));
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
              await writeFile(cachePath, image.toBuffer());
              return image.toDataURL();
            } else {
              const image = await readFile(cachePath, true);
              return await arrayBufferToDataUrl(image);
            }
          }),
        );
        setImages(allImages);
      }
    })();
  }, [notePath]);

  return { setNotePath, images };
}

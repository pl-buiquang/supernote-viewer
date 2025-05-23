/* eslint-disable react/react-in-jsx-scope */
import { useCallback, useEffect, useRef, useState } from 'react';
import { exportPdfTo } from '../../services/pdfViewer';
import * as pdfjs from 'pdfjs-dist';
import { RefProxy } from 'pdfjs-dist/types/src/display/api';
import useAppLogger from '@/hooks/useAppLogger';
import useCache from '@/hooks/useCache';
import './index.css';
import useScrollPosition from '@/hooks/useScrollPosition';
import { useStore } from '@/store';
import usePlatform from '@/hooks/usePlatform';
import { PageViewport } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

type FileViewerProps = {
  file: string;
  scrollableContainerRef?: React.RefObject<HTMLDivElement>;
};

export default function PdfViewer(props: FileViewerProps) {
  const { file, scrollableContainerRef } = props;
  const { logInfo, logWarn, logDebug, logError } = useAppLogger('pdf-viewer');
  const platform = usePlatform();
  const { getCachedFile, exists } = useCache();
  const { store } = useStore();
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [scale] = useState(platform.isMobile ? 0.75 : 1.75);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentProcessedFile = useRef<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const linksRefs = useRef([]);
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const [pageIds, setPageIds] = useState<Record<number, { ref: RefProxy; viewPort: PageViewport }>>({});
  const { currentPageInView } = useScrollPosition({ scrollableContainerRef, file, loaded: numPages > 0 });
  const [lastViewedPage] = useState(store.fileCacheInfo[file]?.lastViewedPage);

  useEffect(() => {
    if (lastViewedPage && !loading) {
      const img = canvasRefs.current[lastViewedPage];
      if (img) {
        loadPages(lastViewedPage);
        img.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [pdf, loading]);

  useEffect(() => {
    (async () => {
      // TODO remove this, it was to make sure not to load multiple time the same file
      if (file !== currentProcessedFile.current) {
        try {
          currentProcessedFile.current = file;
          logInfo('Exporting PDF to marked PDF');
          const isMarkFile = file.endsWith('.pdf.mark');
          const markFilepath = isMarkFile ? file : `${file}.mark`;
          const basePdfFile = isMarkFile ? file.replace('.mark', '') : file;
          const previousExportExists = await exists(basePdfFile);
          logInfo('Previous export exists' + previousExportExists);
          const outputFilename = await getCachedFile(basePdfFile);
          logInfo('Output filename:' + outputFilename);
          let outputFilePath = basePdfFile;
          if (platform.isMobile && !previousExportExists) {
            if (isMarkFile) {
              setError('You must first open the base pdf file to be able to open the marked pdf file');
              return;
            } else {
              const pdfData = await platform.readFile(basePdfFile, false);
              await platform.writeFile(outputFilename, new Uint8Array(pdfData));
            }
          } else {
            const sourceFile = previousExportExists ? outputFilename : basePdfFile;
            logInfo('Source file:' + sourceFile);
            outputFilePath = await exportPdfTo(
              platform,
              sourceFile,
              markFilepath,
              outputFilename,
              previousExportExists,
              {
                logInfo,
                logWarn,
                logDebug,
                logError,
              },
            );
          }

          logInfo('Loading PDF Data', outputFilePath);
          const pdfData = await platform.readFile(outputFilePath, true);
          logInfo('Loading PDF', outputFilePath);
          const loadingTask = pdfjs.getDocument(pdfData);
          const pdf = await loadingTask.promise;
          setPdf(pdf);
          logInfo('PDF loaded');
          setNumPages(pdf.numPages);
          logInfo('Number of pages:', pdf.numPages);

          const pagesInfo = await Promise.all(
            Array.from({ length: pdf.numPages }, async (_, i) => {
              const page = await pdf.getPage(i + 1);
              return { ref: page.ref, viewPort: page.getViewport({ scale }), pageNumber: i + 1 };
            }),
          );
          setPageIds(pagesInfo.reduce((acc, pageInfo) => ({ ...acc, [pageInfo.pageNumber]: pageInfo }), {}));
        } catch (error) {
          logError('Error loading PDF', error);
          setError(error);
        }
      }
    })();
  }, [file]);

  useEffect(() => {
    const initPages = async () => {
      if (pdf && Object.keys(pageIds).length > 0) {
        logInfo('Initializing pages', pageIds);
        await Promise.all(
          Object.values(pageIds).map(async (pageInfo, i) => {
            const canvas = canvasRefs.current[i];
            if (canvas) {
              const viewPort = pageInfo.viewPort;
              canvas.height = viewPort.height;
              canvas.width = viewPort.width;
            }
          }),
        );
        setLoading(false);
      }
    };
    initPages();
  }, [pageIds, pdf]);

  const loadPages = useCallback(
    async (pageIndex: number) => {
      for (let i = pageIndex - 1; i <= pageIndex + 2; i++) {
        if (i < 1 || i > numPages) {
          continue;
        }
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRefs.current[i - 1];

        if (canvas && !canvas.getAttribute('rendered')) {
          logInfo('Rendering page', i);
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = { canvasContext: context, viewport };
          await page.render(renderContext).promise;

          // Extract and handle internal links
          const annotations = await page.getAnnotations();
          annotations.forEach(async (annotation) => {
            if (annotation.subtype === 'Link' && annotation.dest) {
              const [x1, y1, x2, y2] = annotation.rect;

              // Convert PDF coordinates to canvas coordinates
              const rect = {
                left: x1 * viewport.scale,
                top: viewport.height - y2 * viewport.scale, // Flip Y-axis
                width: (x2 - x1) * viewport.scale,
                height: (y2 - y1) * viewport.scale,
              };
              const dest = await pdf.getDestination(annotation.dest);

              // Create a clickable link overlay
              const link = document.createElement('a');
              link.href = annotation.url || `#page-${dest[0].num}-${dest[0].gen}`; // Support internal links
              link.style.position = 'absolute';
              link.style.left = `${rect.left}px`;
              link.style.top = `${rect.top}px`;
              link.style.width = `${rect.width}px`;
              link.style.height = `${rect.height}px`;
              link.style.background = 'rgba(0, 0, 0, 0)'; // Semi-transparent overlay
              link.style.border = 'none';
              link.style.pointerEvents = 'auto'; // Ensure it captures clicks

              // Append link overlay
              linksRefs.current[i - 1].appendChild(link);
            }
          });
          canvas.setAttribute('rendered', 'true');
          logInfo('Page rendered', i);
        }
      }
    },
    [pdf, numPages],
  );

  useEffect(() => {
    logInfo('Loading pages', currentPageInView);
    if (pdf && !loading) {
      loadPages(currentPageInView || 1);
    }
  }, [pdf, currentPageInView, loading]);

  // TODO implement zoom
  // useEffect(() => {
  //   const handleWheel = (e: WheelEvent) => {
  //     if (e.ctrlKey) {
  //       e.preventDefault();
  //       const delta = e.deltaY > 0 ? -0.1 : 0.1;
  //       const newScale = Math.max(0.5, Math.min(3, scale + delta));
  //       setScale(newScale);
  //     }
  //   };

  //   window.addEventListener('wheel', handleWheel, { passive: false });
  //   return () => window.removeEventListener('wheel', handleWheel);
  // }, [scale]);

  if (error) {
    return <div>Error loading PDF : {`${error}`}</div>;
  }

  return (
    <>
      {loading && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex items-center justify-center h-full mt-20">
            <div className="flex flex-col items-center gap-4">
              <div className="loader"></div>
              <div>Loading...</div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center bg-muted/50">
        <div style={{ position: 'relative', overflowY: 'auto', height: '100%' }}>
          {Array.from({ length: numPages }, (_, i) => (
            <div
              id={`page-${pageIds[i + 1]?.ref.num}-${pageIds[i + 1]?.ref.gen}`}
              key={i}
              style={{ position: 'relative' }}
              ref={(el) => (linksRefs.current[i] = el)}
            >
              <canvas id={`${i}`} ref={(el) => (canvasRefs.current[i] = el)} className="page" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

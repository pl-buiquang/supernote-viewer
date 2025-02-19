/* eslint-disable react/react-in-jsx-scope */
import { useCallback, useEffect, useRef, useState } from 'react';
import { exportPdfTo } from '../../services/pdfViewer';
import { readFile } from '@/services/platform';
import * as pdfjs from 'pdfjs-dist';
import { RefProxy } from 'pdfjs-dist/types/src/display/api';
import useAppLogger from '@/hooks/useAppLogger';
import useCache from '@/hooks/useCache';
import './index.css';
import useScrollPosition from '@/hooks/useScrollPosition';
import { useStore } from '@/store';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

type FileViewerProps = {
  file: string;
  scrollableContainerRef?: React.RefObject<HTMLDivElement>;
};

export default function PdfViewer(props: FileViewerProps) {
  const { file, scrollableContainerRef } = props;
  const { logInfo } = useAppLogger('pdf-viewer');
  const { getCachedFile, exists } = useCache();
  const { store } = useStore();
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const currentProcessedFile = useRef<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const linksRefs = useRef([]);
  const canvasRefs = useRef<HTMLCanvasElement[]>([]);
  const [pageIds, setPageIds] = useState<Record<string, RefProxy>>({});
  const { currentPageInView } = useScrollPosition({ scrollableContainerRef, file, loaded: numPages > 0 });
  const [lastViewedPage] = useState(store.fileCacheInfo[file]?.lastViewedPage);

  useEffect(() => {
    if (lastViewedPage && !loading) {
      console.log('Scrolling to page', lastViewedPage);
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
        currentProcessedFile.current = file;
        logInfo('Exporting PDF to marked PDF');
        const markFilepath = `${file}.mark`;
        const previousExportExists = await exists(file);
        logInfo('Previous export exists' + previousExportExists);
        const outputFilename = await getCachedFile(file);
        logInfo('Output filename:' + outputFilename);
        const sourceFile = previousExportExists ? outputFilename : file;
        logInfo('Source file:' + sourceFile);
        const outputFilePath = await exportPdfTo(
          sourceFile,
          markFilepath,
          outputFilename,
          previousExportExists,
          (msg: string) => {
            logInfo(msg);
          },
        );
        logInfo('Loading PDF Data', outputFilePath);
        const pdfData = await readFile(outputFilePath, true);
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
            return { ref: page.ref, viewport: page.getViewport({ scale: 1.5 }), pageNumber: i + 1 };
          }),
        );
        setPageIds(pagesInfo.reduce((acc, pageInfo) => ({ ...acc, [pageInfo.pageNumber]: pageInfo.ref }), {}));
      }
    })();
  }, [file]);

  useEffect(() => {
    const initPages = async () => {
      if (pdf && Object.keys(pageIds).length > 0) {
        console.log('Initializing pages', pageIds);
        await Promise.all(
          Array.from({ length: pdf.numPages }, async (_, i) => {
            const page = await pdf.getPage(i + 1);
            const canvas = canvasRefs.current[i];
            if (canvas) {
              const viewPort = page.getViewport({ scale: 1.5 });
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
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRefs.current[i - 1];

        if (canvas && !canvas.getAttribute('rendered')) {
          console.log('Rendering page', i);
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
          console.log('Page rendered', i);
        }
      }
    },
    [pdf, numPages],
  );

  useEffect(() => {
    console.log('Loading pages', currentPageInView);
    if (pdf && !loading) {
      loadPages(currentPageInView || 1);
    }
  }, [pdf, currentPageInView, loading]);

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
              id={`page-${pageIds[i + 1]?.num}-${pageIds[i + 1]?.gen}`}
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

/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useRef, useState } from 'react';
import { exportPdfTo } from '../../services/pdfViewer';
import { readFile } from '@/services/platform';
import * as pdfjs from 'pdfjs-dist';
import { RefProxy } from 'pdfjs-dist/types/src/display/api';
import useAppLogger from '@/hooks/useAppLogger';
import useCache from '@/hooks/useCache';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

type FileViewerProps = {
  file: string;
};

export default function PdfViewer(props: FileViewerProps) {
  const { logMessage, logs } = useAppLogger();
  const { getCachedFile, exists } = useCache();
  const [outputFilePath, setOutputFilePath] = useState<string | null>(null);
  const [outputData, setOutputData] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const { file } = props;
  const currentProcessedFile = useRef<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const linksRefs = useRef([]);
  const canvasRefs = useRef([]); // Store references to canvas elements
  const [pageIds, setPageIds] = useState<Record<string, RefProxy>>({});

  useEffect(() => {
    (async () => {
      if (file !== currentProcessedFile.current) {
        currentProcessedFile.current = file;
        if (file.endsWith('marked.pdf')) {
          setOutputFilePath(file);
        } else {
          console.log('Exporting PDF to marked PDF');
          const markFilepath = `${file}.mark`;
          const previousExportExists = await exists(`${file.replace('.pdf', '')}.marked.pdf`);
          console.log('Previous export exists', previousExportExists);
          const outputFilename = await getCachedFile(`${file.replace('.pdf', '')}.marked.pdf`);
          console.log('Output filename:', outputFilename);
          const sourceFile = previousExportExists ? outputFilename : file;
          console.log('Source file:', sourceFile);
          const outputFilePath = await exportPdfTo(
            sourceFile,
            markFilepath,
            outputFilename,
            previousExportExists,
            (msg: string) => {
              console.log(msg);
              logMessage(msg, 'pdfViewer');
            },
          );
          setOutputFilePath(outputFilePath);
        }
      }
    })();
  }, [file]);

  useEffect(() => {
    if (outputFilePath !== null) {
      setLoading(false);
    }
  }, [outputFilePath]);

  useEffect(() => {
    const loadPdf = async () => {
      console.log('Loading PDF', outputFilePath);
      const loadingTask = pdfjs.getDocument(outputData);
      const pdf = await loadingTask.promise;
      console.log('PDF loaded');
      setNumPages(pdf.numPages);
      console.log('Number of pages:', pdf.numPages);

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRefs.current[i - 1];
        setPageIds((pagesIds) => ({ ...pagesIds, [i]: page.ref }));

        if (canvas) {
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
        }

        setLoading(false);
      }
    };
    if (outputData) {
      loadPdf();
    }
  }, [outputData]);

  useEffect(() => {
    const loadPdfData = async () => {
      console.log('Loading PDF Data', outputFilePath);
      const pdfData = await readFile(outputFilePath, true);
      setOutputData(pdfData);
    };
    if (outputFilePath) {
      loadPdfData();
    }
  }, [outputFilePath]);

  if (loading || !outputData) {
    return (
      <div>
        <div>Loading ...</div>
        {logs.map((log, i) => (
          <div key={i}>{log.message}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div style={{ position: 'relative', overflowY: 'auto', height: '100%' }}>
        {Array.from({ length: numPages }, (_, i) => (
          <div
            id={`page-${pageIds[i + 1]?.num}-${pageIds[i + 1]?.gen}`}
            key={i}
            style={{ position: 'relative' }}
            ref={(el) => (linksRefs.current[i] = el)}
          >
            <canvas ref={(el) => (canvasRefs.current[i] = el)} />
          </div>
        ))}
      </div>
    </div>
  );
}

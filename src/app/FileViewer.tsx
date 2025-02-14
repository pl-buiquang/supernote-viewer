/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useMemo, useState } from 'react';
import { exportPdf } from '../services/pdfViewer';
import { pdfjs } from 'react-pdf';
import { Document, Page } from 'react-pdf';
import { DocumentCallback } from 'react-pdf/dist/esm/shared/types.js';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

type FileViewerProps = {
  file: string;
};

export default function FileViewer(props: FileViewerProps) {
  const [outputData, setOutputData] = useState<Uint8Array<ArrayBufferLike> | null>(null);
  const { file } = props;
  const currentFile = useMemo(() => file, [file]);
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(currentFile);
    (async () => {
      if (currentFile) {
        const markFilepath = `${currentFile}.mark`;
        //const outputFilename = outputPdfPath || `${pdfPath.replace('.pdf', '')}.marked.pdf`;
        const outputData = await exportPdf(currentFile, markFilepath);
        setOutputData(outputData);
      }
    })();
  }, [currentFile]);

  // useEffect(() => {
  //   const renderPDF = async () => {
  //     try {
  //       console.log('Rendering PDF', outputFile);
  //       const pdfData = await readFile(outputFile);
  //       const loadingTask = pdfjs.getDocument(pdfData);
  //       const pdf = await loadingTask.promise;
  //       console.log('PDF loaded');
  //       const page = await pdf.getPage(1);
  //       console.log('Page loaded');

  //       const scale = 1.5;
  //       const viewport = page.getViewport({ scale });

  //       const canvas = canvasRef.current;
  //       console.log('Canvas', canvas);
  //       if (!canvas) return;
  //       const context = canvas.getContext('2d');

  //       canvas.width = viewport.width;
  //       canvas.height = viewport.height;
  //       console.log('Rendering PDF to canvas');
  //       await page.render({ canvasContext: context!, viewport }).promise;
  //       console.log('PDF rendered to canvas');
  //       setLoading(false);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };

  //   renderPDF();
  // }, [outputFile]);
  const [numPages, setNumPages] = useState<number>();
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();
  function onDocumentLoadSuccess({ numPages: nextNumPages }: DocumentCallback): void {
    setNumPages(nextNumPages);
  }

  return (
    <div style={{ width: '100%', height: '100%' }} ref={setContainerRef}>
      {outputData ? (
        <Document file={{ data: outputData }} onLoadSuccess={onDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (_el, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} width={containerWidth} />
          ))}
        </Document>
      ) : (
        <div />
      )}
    </div>
  );
}

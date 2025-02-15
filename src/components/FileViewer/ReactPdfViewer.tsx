/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useMemo, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { DocumentCallback } from 'react-pdf/dist/esm/shared/types.js';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { readFile } from '@/services/platform';

// import * as pdfjs from 'pdfjs-dist';

// pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

type FileViewerProps = {
  file: string;
};

export default function ReactPdfViewer(props: FileViewerProps) {
  const [outputFilePath, setOutputFilePath] = useState<string | null>(null);
  const [outputData, setOutputData] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const { file } = props;
  const currentFile = useMemo(() => file, [file]);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    console.log(currentFile);
    (async () => {
      if (currentFile) {
        setOutputFilePath(currentFile);
        // if (currentFile.endsWith('marked.pdf')) {
        //   setOutputFilePath(currentFile);
        // } else {
        //   const markFilepath = `${currentFile}.mark`;
        //   const outputFilename = `${currentFile.replace('.pdf', '')}.marked.pdf`;
        //   const outputFilePath = await exportPdfTo(currentFile, markFilepath, outputFilename);
        //   setOutputFilePath(outputFilePath);
        // }
      }
    })();
  }, [currentFile]);

  useEffect(() => {
    const loadPdfData = async () => {
      console.log('Loading PDF Data', outputFilePath);
      const pdfData = await readFile(outputFilePath);
      setOutputData(pdfData);
      setLoading(false);
    };
    loadPdfData();
  }, [outputFilePath]);

  function onDocumentLoadSuccess({ numPages: nextNumPages }: DocumentCallback): void {
    setNumPages(nextNumPages);
  }

  if (loading || !outputData) {
    return <div>Loading ...</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <Document file={{ data: new Uint8Array(outputData) }} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (el, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} />
        ))}
      </Document>
    </div>
  );
}

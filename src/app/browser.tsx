/* eslint-disable react/react-in-jsx-scope */
import { Button } from '@/components/ui/button';
import { readDir, BaseDirectory, readFile } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { useEffect, useRef, useState } from 'react';
import { exportPdf } from '../services/pdfViewer';
import * as pdfjs from 'pdfjs-dist';

// GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.mjs",
//   import.meta.url
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

type BrowserProps = {
  baseFolder: string | null;
};

export default function Browser(props: BrowserProps) {
  const { baseFolder } = props;
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [outputFile, setOutputFile] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const entries = await readDir('users', { baseDir: BaseDirectory.AppLocalData });
      console.log(entries);
    })();
  }, [baseFolder]);

  const handleChooseFolder = async () => {
    // Open a dialog
    const file = await open({
      multiple: false,
      directory: false,
    });
    setCurrentFile(file);
  };

  useEffect(() => {
    console.log(currentFile);
    (async () => {
      if (currentFile) {
        const outputFile = await exportPdf(currentFile);
        console.log(outputFile);
        setOutputFile(outputFile);
      }
    })();
  }, [currentFile]);

  useEffect(() => {
    const renderPDF = async () => {
      try {
        console.log('Rendering PDF', outputFile);
        const pdfData = await readFile(outputFile);
        const loadingTask = pdfjs.getDocument(pdfData);
        const pdf = await loadingTask.promise;
        console.log('PDF loaded');
        const page = await pdf.getPage(1);
        console.log('Page loaded');

        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        console.log('Canvas', canvas);
        if (!canvas) return;
        const context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        console.log('Rendering PDF to canvas');
        await page.render({ canvasContext: context!, viewport }).promise;
        console.log('PDF rendered to canvas');
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    renderPDF();
  }, [outputFile]);

  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-1">
        <Button className="w-full" onClick={handleChooseFolder}>
          Choose File
        </Button>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
        {loading && <p>Loading PDF...</p>}
        <canvas ref={canvasRef} />
      </div>
    </>
  );
}

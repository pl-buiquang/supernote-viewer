import { useMemo } from 'react';
import PdfViewer from './PdfViewer';
import NoteViewer from './NoteViewer';

type FileViewerProps = {
  file: string;
};

const viewers = {
  '.pdf': (file) => <PdfViewer file={file} />,
  '.note': (file) => <NoteViewer file={file} />,
};

export default function FileViewer(props: FileViewerProps) {
  const { file } = props;
  const currentFile = useMemo(() => file, [file]);

  return (
    <div className="bg-muted/50" style={{ maxWidth: '1024px', height: '100%' }}>
      {Object.entries(viewers).find(([ext]) => file.endsWith(ext))?.[1](currentFile)}
    </div>
  );
}

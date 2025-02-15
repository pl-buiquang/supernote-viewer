import { useMemo } from 'react';
import PdfViewer from './PdfViewer';
import NoteViewer from './NoteViewer';

type FileViewerProps = {
  file: string;
};

export default function FileViewer(props: FileViewerProps) {
  const { file } = props;
  const currentFile = useMemo(() => file, [file]);

  return (
    <div className="bg-muted/50" style={{ maxWidth: '1024px', height: '100%' }}>
      {file.endsWith('.pdf') ? <PdfViewer file={currentFile} /> : <NoteViewer file={currentFile} />}
    </div>
  );
}

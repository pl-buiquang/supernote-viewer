import PdfViewer from './PdfViewer';
import NoteViewer from './NoteViewer';

type FileViewerProps = {
  file: string;
  scrollableContainerRef?: React.RefObject<HTMLDivElement>;
};

const viewers = {
  '.pdf': (file, scrollableContainerRef) => <PdfViewer file={file} scrollableContainerRef={scrollableContainerRef} />,
  '.pdf.mark': (file, scrollableContainerRef) => (
    <PdfViewer file={file} scrollableContainerRef={scrollableContainerRef} />
  ),
  '.note': (file, scrollableContainerRef) => <NoteViewer file={file} scrollableContainerRef={scrollableContainerRef} />,
};

export default function FileViewer(props: FileViewerProps) {
  const { file, scrollableContainerRef } = props;

  return (
    <div style={{ maxWidth: '1024px', height: '100%' }}>
      {Object.entries(viewers).find(([ext]) => file.endsWith(ext))?.[1](file, scrollableContainerRef) || (
        <div>Unsupported file type</div>
      )}
    </div>
  );
}

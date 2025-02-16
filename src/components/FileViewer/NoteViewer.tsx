import { useEffect, useRef } from 'react';
import useNoteView from '@/hooks/useNoteView';

type FileViewerProps = {
  file: string;
};

export default function PdfViewer(props: FileViewerProps) {
  const { file } = props;
  const currentFile = useRef<string>(null);
  const { images, setNotePath } = useNoteView();

  useEffect(() => {
    if (currentFile.current !== file) {
      currentFile.current = file;
      setNotePath(file);
    }
  }, [file]);

  if (images) {
    return (
      <>
        {images.map((image, i) => (
          <img key={i} src={image} alt={`Page ${i}`} />
        ))}
      </>
    );
  }

  return <div>Loading ...</div>;
}

import { useEffect, useRef } from 'react';
import useNoteView from '@/hooks/useNoteView';
import './index.css';
import useScrollPosition from '@/hooks/useScrollPosition';

type FileViewerProps = {
  file: string;
  scrollableContainerRef?: React.RefObject<HTMLDivElement>;
};

export default function NoteViewer(props: FileViewerProps) {
  const { file, scrollableContainerRef } = props;
  const currentFile = useRef<string>(null);
  const { images, setNotePath } = useNoteView();
  useScrollPosition({ scrollableContainerRef, file, data: images });

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
          <div id={`${i}`} key={i} className="bg-muted/50 flex justify-center items-center mb-6 page">
            <img src={image} alt={`Page ${i}`} />
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex items-center justify-center h-full mt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="loader"></div>
          <div>Loading...</div>
        </div>
      </div>
    </div>
  );
}

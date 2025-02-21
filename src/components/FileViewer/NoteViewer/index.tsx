import { useCallback, useEffect, useRef } from 'react';
import useNoteView from '@/hooks/useNoteView';
import '../index.css';
import useScrollPosition from '@/hooks/useScrollPosition';
import NoteMenu from './Menu';

type FileViewerProps = {
  file: string;
  scrollableContainerRef?: React.RefObject<HTMLDivElement>;
};

export default function NoteViewer(props: FileViewerProps) {
  const { file, scrollableContainerRef } = props;
  const currentFile = useRef<string>(null);
  const { note, images, setNotePath } = useNoteView();
  const imageRefs = useRef<HTMLDivElement[]>([]);
  useScrollPosition({ scrollableContainerRef, file, loaded: !!images, initLastScrollPosition: true });

  useEffect(() => {
    // TODO remove this, it was to make sure not to load multiple time the same file
    if (currentFile.current !== file) {
      currentFile.current = file;
      setNotePath(file);
    }
  }, [file]);

  const scrollToPage = useCallback((page: number) => {
    const pageRef = imageRefs.current?.[page];
    if (pageRef) {
      pageRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (images) {
    return (
      <>
        <NoteMenu note={note} scrollToPage={scrollToPage} />
        {images.map((image, i) => (
          <div
            id={`${i}`}
            key={i}
            className="bg-muted/50 flex justify-center items-center mb-6 page"
            ref={(el) => (imageRefs.current[i] = el)}
          >
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

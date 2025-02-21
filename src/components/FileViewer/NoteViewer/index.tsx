import { useCallback, useEffect, useRef, useState } from 'react';
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

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isModalOpen]);

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
            className="bg-muted/50 flex justify-center items-center mb-6 page relative group/info"
            ref={(el) => (imageRefs.current[i] = el)}
          >
            <div className="absolute top-2 left-2 opacity-0 group-hover/info:opacity-100 transition-opacity duration-200">
              <div className="flex items-center bg-black/50 backdrop-blur-sm rounded-full py-1 px-2 group/info-icon">
                <div className="text-white text-sm min-w-4 text-center">{i + 1}</div>
                <div className="w-0 group-hover/info-icon:w-6 transition-all duration-200 overflow-hidden">
                  <button className="text-white hover:text-white/80 ml-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="15" r="1" />
                      <circle cx="19" cy="15" r="1" />
                      <circle cx="5" cy="15" r="1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <img
              src={image}
              alt={`Page ${i}`}
              className="cursor-pointer"
              onClick={() => {
                setSelectedImage(image);
                setIsModalOpen(true);
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
            />

            {isModalOpen && selectedImage === image && (
              <div
                className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsModalOpen(false);
                    setScale(1);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsModalOpen(false);
                    setScale(1);
                  }
                }}
                ref={modalRef}
                tabIndex={0}
              >
                <div className="relative w-[98%] h-[98%] flex items-center justify-center bg-white rounded-2xl p-6">
                  <div className="absolute top-4 right-4 z-50">
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        setScale(1);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div
                    className="overflow-hidden w-full h-full cursor-move flex items-center justify-center"
                    onWheel={(e) => {
                      e.preventDefault();
                      const delta = e.deltaY * -0.005;
                      const newScale = Math.min(Math.max(scale + delta, 1), 5);
                      setScale(newScale);
                    }}
                    onMouseDown={(e) => {
                      setIsDragging(true);
                      dragStart.current = {
                        x: e.clientX - position.x,
                        y: e.clientY - position.y,
                      };
                    }}
                    onMouseMove={(e) => {
                      if (isDragging) {
                        setPosition({
                          x: e.clientX - dragStart.current.x,
                          y: e.clientY - dragStart.current.y,
                        });
                      }
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    <img
                      src={selectedImage}
                      alt={`Page ${i} (zoomed)`}
                      className="bg-muted/50"
                      style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                        transformOrigin: 'center',
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                      }}
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            )}
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

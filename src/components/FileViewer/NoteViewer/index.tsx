import { useCallback, useEffect, useRef, useState } from 'react';
import useNoteView from '@/hooks/useNoteView';
import '../index.css';
import useScrollPosition from '@/hooks/useScrollPosition';
import NoteMenu from './Menu';
import { extractPageRefFromTitle } from '@/services/noteViewer';
import { SupernoteX } from 'supernote-typescript';
import { useStore } from '@/store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type FileViewerProps = {
  file: string;
  scrollableContainerRef?: React.RefObject<HTMLDivElement>;
};

const getNoteLink = (notePath: string) => {
  const androidNotePath = '/storage/emulated/0/Note/';
  if (notePath.startsWith(androidNotePath)) {
    return notePath.replace(androidNotePath, '');
  }
  return null;
};

const getLinkForPage = (note: SupernoteX, page: number, currentFile: string, currentFolder?: string) => {
  return Object.keys(note.links)
    .map((key) => ({ ...note.links[key].at(0), LINKSEQNO: key }))
    .filter((link) => extractPageRefFromTitle(link.LINKSEQNO) === page)
    .map((link) => {
      const rect = (link.LINKRECT as unknown as string).split(',').map((n) => parseFloat(n));
      const [x, y, width, height] = [
        (rect[0] / note.pageWidth) * 100,
        (rect[1] / note.pageHeight) * 100,
        (rect[2] / note.pageWidth) * 100,
        (rect[3] / note.pageHeight) * 100,
      ];
      const noteLink = link.LINKFILE ? getNoteLink(decodeURIComponent(atob(link.LINKFILE))) : null;
      return {
        ...link,
        LINKRECT: [x, y, width, height],
        pageLink: link.OBJPAGE !== 'none' ? parseInt(link.OBJPAGE) : null,
        noteLink: (currentFolder ? currentFolder + '/' : '') + noteLink,
        sameNote: currentFile.endsWith(noteLink),
      };
    });
};

const getOCRText = (note: SupernoteX, page: number) => {
  const paragraphs = note.pages[page]?.recognitionElements?.filter((el) => el.type === 'Text') || [];
  if (paragraphs.length === 0) return <div className="text-gray-400">No OCR Text</div>;
  return paragraphs.map((el, i) => (
    <div key={i}>
      {el.label.split('\n').map((sub, j) => (
        <div key={j}>{sub}</div>
      ))}
    </div>
  ));
};

export default function NoteViewer(props: FileViewerProps) {
  const { file, scrollableContainerRef } = props;
  const { store, setStoreValue } = useStore();
  const currentFile = useRef<string>(null);
  const { note, images, setNotePath, error } = useNoteView();
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
            <div className="absolute top-0 left-0 w-full h-full">
              {getLinkForPage(note, i + 1, file, store.baseFolder).map((link) => {
                return (
                  <a
                    key={link.LINKSEQNO}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (link.sameNote) {
                        if (link.pageLink !== null) {
                          scrollToPage(link.pageLink - 1);
                        }
                      } else if (link.noteLink) {
                        setStoreValue('currentFile', link.noteLink);
                      }
                    }}
                    className="absolute cursor-pointer"
                    style={{
                      top: `${link.LINKRECT[1]}%`,
                      left: `${link.LINKRECT[0]}%`,
                      width: `${link.LINKRECT[2]}%`,
                      height: `${link.LINKRECT[3]}%`,
                    }}
                  />
                );
              })}
            </div>
            <div className="absolute top-2 left-2 opacity-0 group-hover/info:opacity-100 transition-opacity duration-200">
              <Tooltip delayDuration={0}>
                <TooltipTrigger>
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
                </TooltipTrigger>
                <TooltipContent side="right" align="start" sideOffset={10}>
                  {getOCRText(note, i)}
                </TooltipContent>
              </Tooltip>
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

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-center justify-center h-full mt-20">
          <div className="flex flex-col items-center gap-4">
            <div className="text-red-500">Error: {`${error}`}</div>
          </div>
        </div>
      </div>
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

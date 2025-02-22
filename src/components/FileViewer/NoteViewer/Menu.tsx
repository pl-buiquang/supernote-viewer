import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Image } from 'image-js';
import { SupernoteX, RattaRLEDecoder } from 'supernote-typescript';
import { useEffect, useRef, useState } from 'react';
import { extractPageRefFromTitle } from '@/services/noteViewer';

type NoteMenuProps = {
  note: SupernoteX | null;
  scrollToPage: (page: number) => void;
};

export function NoteMenu(props: NoteMenuProps) {
  const { note, scrollToPage } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [titles, setTitles] = useState([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const scrollToPageAndCloseMenu = (pageNumber: number) => {
    scrollToPage(pageNumber);
    setIsOpen(false);
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (!note?.titles) {
      return;
    }
    const loadTitles = async () => {
      const decoder = new RattaRLEDecoder();
      const titles = await Promise.all(
        Object.keys(note?.titles).map(async (titleKey) => {
          const title = note.titles[titleKey];
          const firstTitle = title.at(0);
          if (!firstTitle) {
            return null;
          }
          const width = parseInt(firstTitle.TITLERECTORI[2]);
          const height = parseInt(firstTitle.TITLERECTORI[3]);
          const bitmapBuffer = decoder.decode(firstTitle.bitmapBuffer, width, height);
          const image = new Image(width, height, bitmapBuffer, {
            components: 3,
            alpha: 1,
          });
          return { id: titleKey, image: image.toDataURL(), page: extractPageRefFromTitle(titleKey) };
        }),
      );
      setTitles(titles);
    };
    loadTitles();
  }, [note]);

  if (!note) {
    return null;
  }

  return (
    <div ref={menuRef} className="fixed right-4 top-4 z-50">
      <Button
        variant="default"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="floating-menu-panel"
        className="relative z-50 h-8 w-8 rounded-full shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Menu Panel */}
      <div
        id="floating-menu-panel"
        className={cn(
          'absolute right-0 top-16 right-1 w-[calc(100vw-2rem)] max-w-md rounded-lg bg-background p-6 shadow-lg transition-all duration-200',
          'border overflow-auto max-h-[75vh]',
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        )}
        style={isOpen ? {} : { right: '-20px' }}
      >
        <nav className="space-y-4">
          <h2 className="text-xl font-semibold">Menu</h2>

          <details open>
            <summary className="text-lg font-semibold cursor-pointer hover:bg-muted/50 p-2 rounded-md">
              Table of Contents
            </summary>
            <ul className="space-y-2 mt-2 pl-4">
              {titles.map((title) => {
                return (
                  <li key={title.id}>
                    <a
                      href="#"
                      className="block rounded-md px-4 py-2 text-sm hover:bg-muted"
                      onClick={() => scrollToPageAndCloseMenu(title.page - 1)}
                    >
                      <img src={title.image} alt={title.id} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </details>

          <details>
            <summary className="text-lg font-semibold cursor-pointer hover:bg-muted/50 p-2 rounded-md">Pages</summary>
            <div className="mt-2 pl-4">
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" className="rounded" onChange={(e) => setShowStarredOnly(e.target.checked)} />
                <span className="text-sm">Show starred pages only</span>
              </label>
              <ul className="space-y-2">
                {note.pages
                  .map((page, i) => ({ page, i }))
                  .filter(({ page }) => !showStarredOnly || page.FIVESTAR)
                  .map(({ page, i }) => {
                    return (
                      <li key={page.PAGEID}>
                        <a
                          href="#"
                          className="block rounded-md px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                          onClick={() => scrollToPageAndCloseMenu(i)}
                        >
                          <span>Page {i + 1}</span>
                          {page.FIVESTAR && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-yellow-500"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          )}
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </details>
        </nav>
      </div>
    </div>
  );
}

export default NoteMenu;

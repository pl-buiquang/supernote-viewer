import { useStore } from '@/store';
import { useEffect, useState } from 'react';

type UseScrollPositionProps = {
  scrollableContainerRef: React.RefObject<HTMLDivElement>;
  file: string;
  loaded: boolean;
  initLastScrollPosition?: boolean;
};

const useScrollPosition = (props: UseScrollPositionProps) => {
  const { scrollableContainerRef, file, loaded, initLastScrollPosition = false } = props;
  const { store, updateFileScrollPosition, updateLastViewedPage } = useStore();
  const [lastScrollPosition] = useState<number>(store.fileScrollPosition[file]);
  const [currentPageInView, setCurrentPageInView] = useState<number>(null);

  const getViewableElements = () => {
    if (!scrollableContainerRef?.current?.parentElement) return;

    const container = scrollableContainerRef?.current?.parentElement;
    if (!container) return [];
    const containerRect = container.getBoundingClientRect();
    const items = Array.from(container.getElementsByClassName('page'));

    const visibleItems = items.filter((item) => {
      const itemRect = item.getBoundingClientRect();
      return (
        itemRect.bottom > containerRect.top && // Item is not scrolled above
        itemRect.top < containerRect.bottom // Item is not scrolled below
      );
    });

    return visibleItems;
  };

  const updateLastViewedPageNumber = () => {
    const viewablesElements = getViewableElements();
    if (viewablesElements.length > 0) {
      const lastViewedPage = parseInt(viewablesElements[0]?.id);
      setCurrentPageInView(lastViewedPage);
      updateLastViewedPage(file, lastViewedPage);
    }
  };

  useEffect(() => {
    if (scrollableContainerRef?.current?.parentElement && loaded) {
      if (initLastScrollPosition && lastScrollPosition) {
        scrollableContainerRef.current.parentElement.scrollTop = lastScrollPosition;
      }
      const handleScroll = () => {
        updateLastViewedPageNumber();
        if (store.currentFile && scrollableContainerRef.current.parentElement.scrollTop !== 0) {
          updateFileScrollPosition(store.currentFile, scrollableContainerRef.current.parentElement.scrollTop);
        }
      };

      scrollableContainerRef.current.parentElement.addEventListener('scroll', handleScroll);
      return () => {
        scrollableContainerRef.current.parentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [loaded]);

  return { currentPageInView };
};

export default useScrollPosition;

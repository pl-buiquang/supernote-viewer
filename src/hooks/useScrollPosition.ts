import { useStore } from '@/store';
import { useEffect } from 'react';

type UseScrollPositionProps = {
  scrollableContainerRef: React.RefObject<HTMLDivElement>;
  file: string;
  data: unknown;
};

const useScrollPosition = (props: UseScrollPositionProps) => {
  const { scrollableContainerRef, file, data } = props;
  const { store, updateFileScrollPosition } = useStore();

  useEffect(() => {
    if (scrollableContainerRef.current && store.fileScrollPosition[file]) {
      scrollableContainerRef.current.parentElement.scrollTop = store.fileScrollPosition[file];
    }
    if (scrollableContainerRef.current) {
      const handleScroll = () => {
        if (store.currentFile && scrollableContainerRef.current.parentElement.scrollTop !== 0) {
          updateFileScrollPosition(store.currentFile, scrollableContainerRef.current.parentElement.scrollTop);
        }
      };

      scrollableContainerRef.current.parentElement.addEventListener('scroll', handleScroll);
      return () => {
        scrollableContainerRef.current.parentElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [data]);
};

export default useScrollPosition;

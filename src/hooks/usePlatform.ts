import { Platform } from '@/services/platform';
import useAppLogger from './useAppLogger';

const usePlatform = (): Platform => {
  const logger = useAppLogger('platform');
  return new Platform(logger);
};

export default usePlatform;

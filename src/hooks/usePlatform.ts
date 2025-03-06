import { IPlatform, PlatformFactory } from '@/services/platform/index';
import useAppLogger from './useAppLogger';

const usePlatform = (): IPlatform => {
  const logger = useAppLogger('platform');
  return PlatformFactory.createPlatform(logger);
};

export default usePlatform;

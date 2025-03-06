import { Logger } from '../../types/index.js';
import { IPlatform } from './IPlatform.js';
import { TauriPlatform } from './TauriPlatform.js';
import { NodePlatform } from './NodePlatform.js';

// Check if Tauri is available in the window object
/* eslint-disable @typescript-eslint/no-explicit-any */
export const withTauri = !!(window as any).__TAURI__;

export class PlatformFactory {
  /**
   * Creates and returns the appropriate platform implementation
   * @param logger Logger instance
   * @param forceTauri Override to force using Tauri platform (defaults to auto-detection)
   */
  static createPlatform(logger: Logger, forceTauri?: boolean): IPlatform {
    const useTauri = forceTauri !== undefined ? forceTauri : withTauri;

    if (useTauri) {
      logger.logInfo('Creating Tauri platform implementation');
      return new TauriPlatform(logger);
    } else {
      logger.logInfo('Creating Node platform implementation');
      return new NodePlatform(logger);
    }
  }
}

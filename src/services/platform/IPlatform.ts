import { FileItem } from '../../types/index.js';
import { Logger } from '../../types/index.js';

export interface IPlatform {
  isMobile: boolean;
  logger: Logger;

  // File operations
  readFile(path: string, localAppData?: boolean): Promise<ArrayBuffer>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  exists(path: string, localAppData?: boolean): Promise<boolean>;
  deleteFile(path: string, localAppData?: boolean): Promise<void>;

  // Directory operations
  createDir(path: string): Promise<void>;
  listFiles(dir: string): Promise<FileItem[]>;

  // Dialog operations
  openFile(): Promise<string>;
  openDir(): Promise<string>;
}

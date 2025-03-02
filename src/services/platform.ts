/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  stat,
  readDir,
  exists as tauriExists,
  readFile as tauriReadFile,
  writeFile as tauriWriteFile,
  remove as tauriDeleteFile,
  BaseDirectory,
  mkdir,
} from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { platform } from '@tauri-apps/plugin-os';
import { FileItem, getFileType } from '@/types';
import { byteSizeToString } from './utils';
import { Logger } from '@/hooks/useAppLogger';
// when using `"withGlobalTauri": true`, you may use
// const { platform } = window.__TAURI__.os;

export const withTauri = !!(window as any).__TAURI__;

export class Platform {
  private logger: Logger;
  public isMobile = withTauri && (platform() === 'android' || platform() === 'ios');

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // Read File
  async readFile(path: string, localAppData: boolean = false): Promise<ArrayBuffer> {
    this.logger.logInfo('Tauri: Reading file ', path);
    const options = localAppData ? { baseDir: BaseDirectory.AppLocalData } : {};
    const fileData = await tauriReadFile(path, options);
    return fileData.buffer;
  }

  // Write File
  async writeFile(path: string, data: Uint8Array) {
    this.logger.logInfo('Tauri: Writing file ', path);
    return await tauriWriteFile(path, data, { baseDir: BaseDirectory.AppLocalData });
  }

  async createDir(path: string) {
    this.logger.logInfo('Tauri: Creating directory ', path);
    return await mkdir(path, {
      baseDir: BaseDirectory.AppLocalData,
    });
  }

  async exists(path: string, localAppData: boolean = false): Promise<boolean> {
    this.logger.logInfo('Tauri: Checking if file exists', path);
    const options = localAppData ? { baseDir: BaseDirectory.AppLocalData } : {};
    return await tauriExists(path, options);
  }
  async deleteFile(path: string, localAppData: boolean = false) {
    this.logger.logInfo('Tauri: Deleting file', path);
    const options = localAppData ? { baseDir: BaseDirectory.AppLocalData } : {};
    const exists = await tauriExists(path, options);
    if (exists) {
      await tauriDeleteFile(path, options);
    }
  }
  async listFiles(dir: string): Promise<FileItem[]> {
    this.logger.logInfo('Tauri: Listing files from', dir);
    try {
      const entries = await readDir(dir, {});
      const metadata = await Promise.all(
        entries.map((e) => {
          try {
            return stat(`${dir}/${e.name}`, {});
          } catch (error) {
            this.logger.logError('Error reading file metadata', error);
            return { isDirectory: false, size: 0, atime: 0 };
          }
        }),
      );
      return metadata.map((m, i) => ({
        id: entries[i].name,
        name: entries[i].name,
        type: m.isDirectory ? 'directory' : getFileType(entries[i].name),
        size: byteSizeToString(m.size),
        byteSize: m.size,
        modifiedDate: m.atime.toLocaleString(),
      }));
    } catch (error) {
      this.logger.logError('Error listing files', error);
      return [];
    }
  }

  async openFile(): Promise<string> {
    return await open({ multiple: false, directory: false });
  }

  async openDir(): Promise<string> {
    return await open({ multiple: false, directory: true });
  }
}

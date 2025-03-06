/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs-extra';
import path from 'path';
import { FileItem, getFileType } from '../../types/index.js';
import { byteSizeToString } from '../utils.js';
import { Logger } from '../../types/index.js';
import { IPlatform } from './IPlatform.js';

export class NodePlatform implements IPlatform {
  public logger: Logger;
  public isMobile = false; // Node.js is never mobile

  private appDataPath: string;

  constructor(logger: Logger) {
    this.logger = logger;

    // Determine app data path based on platform
    const platform = process.platform;
    let basePath: string;

    if (platform === 'win32') {
      basePath = process.env.APPDATA || '';
    } else if (platform === 'darwin') {
      basePath = path.join(process.env.HOME || '', 'Library', 'Application Support');
    } else {
      // Linux and others
      basePath = process.env.XDG_DATA_HOME || path.join(process.env.HOME || '', '.local', 'share');
    }

    this.appDataPath = path.join(basePath, 'supernote-viewer');
  }

  async readFile(filePath: string, localAppData = false): Promise<ArrayBuffer> {
    const resolvedPath = localAppData ? path.join(this.appDataPath, filePath) : filePath;
    this.logger.logInfo('Node: Reading file', resolvedPath);

    const data = await fs.readFile(resolvedPath);
    return data.buffer;
  }

  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    const resolvedPath = path.join(this.appDataPath, filePath);
    this.logger.logInfo('Node: Writing file', resolvedPath);

    // Ensure directory exists
    await fs.ensureDir(path.dirname(resolvedPath));
    return await fs.writeFile(resolvedPath, data);
  }

  async createDir(dirPath: string): Promise<void> {
    const resolvedPath = path.join(this.appDataPath, dirPath);
    this.logger.logInfo('Node: Creating directory', resolvedPath);
    return await fs.ensureDir(resolvedPath);
  }

  async exists(filePath: string, localAppData = false): Promise<boolean> {
    const resolvedPath = localAppData ? path.join(this.appDataPath, filePath) : filePath;
    this.logger.logInfo('Node: Checking if file exists', resolvedPath);
    return await fs.pathExists(resolvedPath);
  }

  async deleteFile(filePath: string, localAppData = false): Promise<void> {
    const resolvedPath = localAppData ? path.join(this.appDataPath, filePath) : filePath;
    this.logger.logInfo('Node: Deleting file', resolvedPath);

    const exists = await fs.pathExists(resolvedPath);
    if (exists) {
      await fs.remove(resolvedPath);
    }
  }

  async listFiles(dir: string): Promise<FileItem[]> {
    this.logger.logInfo('Node: Listing files from', dir);

    const entries = await fs.readdir(dir);
    const fileItems: FileItem[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = await fs.stat(fullPath);

      fileItems.push({
        id: entry,
        name: entry,
        type: stats.isDirectory() ? 'directory' : getFileType(entry),
        size: byteSizeToString(stats.size),
        byteSize: stats.size,
        modifiedDate: stats.mtime.toLocaleString(),
      });
    }

    return fileItems;
  }

  async openFile(): Promise<string> {
    this.logger.logWarn('Node: openFile dialog not implemented in Node environment');
    throw new Error('File dialog not supported in Node environment');
  }

  async openDir(): Promise<string> {
    this.logger.logWarn('Node: openDir dialog not implemented in Node environment');
    throw new Error('Directory dialog not supported in Node environment');
  }
}

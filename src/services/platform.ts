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
// when using `"withGlobalTauri": true`, you may use
// const { platform } = window.__TAURI__.os;

// Detect Platform
export const isMobile = platform() === 'android' || platform() === 'ios';

// Read File
export async function readFile(path: string, localAppData: boolean = false): Promise<ArrayBuffer> {
  console.log('Tauri: Reading file ', path);
  const options = localAppData ? { baseDir: BaseDirectory.AppLocalData } : {};
  const fileData = await tauriReadFile(path, options);
  return fileData.buffer;
}

// Write File
export async function writeFile(path: string, data: Uint8Array) {
  console.log('Tauri: Writing file ', path);
  return await tauriWriteFile(path, data, { baseDir: BaseDirectory.AppLocalData });
}

export async function createDir(path: string) {
  console.log('Tauri: Creating directory ', path);
  return await mkdir(path, {
    baseDir: BaseDirectory.AppLocalData,
  });
}

export const exists = async (path: string, localAppData: boolean = false): Promise<boolean> => {
  console.log('Tauri: Checking if file exists', path);
  const options = localAppData ? { baseDir: BaseDirectory.AppLocalData } : {};
  return await tauriExists(path, options);
};

export const deleteFile = async (path: string, localAppData: boolean = false) => {
  console.log('Tauri: Deleting file', path);
  const options = localAppData ? { baseDir: BaseDirectory.AppLocalData } : {};
  const exists = await tauriExists(path, options);
  if (exists) {
    await tauriDeleteFile(path, options);
  }
};

export type FileType = 'pdf' | 'note' | 'directory' | 'unknown';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  modifiedDate: string;
}

const getType = (file: string): FileType => {
  const ext = file.split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'note') return 'note';
  return 'unknown';
};

const getSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export async function listFiles(dir: string): Promise<FileItem[]> {
  console.log('Tauri: Listing files from', dir);
  const entries = await readDir(dir, {});
  const metadata = await Promise.all(entries.map((e) => stat(`${dir}/${e.name}`, {})));
  return metadata.map((m, i) => ({
    id: entries[i].name,
    name: entries[i].name,
    type: m.isDirectory ? 'directory' : getType(entries[i].name),
    size: getSize(m.size),
    modifiedDate: m.atime.toDateString(),
  }));
}

export async function openFile(): Promise<string> {
  return await open({ multiple: false, directory: false });
}

export async function openDir(): Promise<string> {
  return await open({ multiple: false, directory: true });
}

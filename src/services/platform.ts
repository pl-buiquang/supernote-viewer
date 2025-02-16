/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  stat,
  readDir,
  exists as tauriExists,
  readFile as tauriReadFile,
  writeFile as tauriWriteFile,
  BaseDirectory,
  mkdir,
} from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { Filesystem as CapFilesystem, Directory } from '@capacitor/filesystem';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { platform } from '@tauri-apps/plugin-os';
// when using `"withGlobalTauri": true`, you may use
// const { platform } = window.__TAURI__.os;

// Detect Platform
export const isTauri = !!(window as any).__TAURI__;
export const isCapacitor = !!(window as any).Capacitor;

export let isMobile = false;
if (isTauri) {
  const currentPlatform = platform();
  isMobile = currentPlatform === 'android' || currentPlatform === 'ios';
} else if (isCapacitor) {
  isMobile = true;
}

// Read File
export async function readFile(path: string, localAppData: boolean = false): Promise<ArrayBuffer> {
  if (isTauri) {
    console.log('Tauri: Reading file ', path);
    const options = localAppData ? { baseDir: BaseDirectory.AppLocalData } : {};
    return (await tauriReadFile(path, options)).buffer;
  } else if (isCapacitor) {
    console.log('Capacitor: Reading file ', path);
    await CapFilesystem.requestPermissions();
    const result = await CapFilesystem.readFile({ path });
    return (result.data as Blob).arrayBuffer();
  }
  throw new Error('Unsupported platform');
}

// Write File
export async function writeFile(path: string, data: Uint8Array) {
  if (isTauri) {
    console.log('Tauri: Writing file ', path);
    return await tauriWriteFile(path, data, { baseDir: BaseDirectory.AppLocalData });
  } else if (isCapacitor) {
    console.log('Capacitor: Writing file ', path);
    await CapFilesystem.requestPermissions();
    return await CapFilesystem.writeFile({
      path,
      data: new Blob([data], { type: 'application/octet-stream' }),
      directory: Directory.Documents,
    });
  }
  throw new Error('Unsupported platform');
}

export async function createDir(path: string) {
  if (isTauri) {
    console.log('Tauri: Creating directory ', path);
    return await mkdir(path, {
      baseDir: BaseDirectory.AppLocalData,
    });
  } else if (isCapacitor) {
    return await CapFilesystem.mkdir({ path });
  }
  throw new Error('Unsupported platform');
}

export const exists = async (path: string, localAppData: boolean = false): Promise<boolean> => {
  if (isTauri) {
    console.log('Tauri: Checking if file exists', path);
    const options = localAppData ? { baseDir: BaseDirectory.AppLocalData } : {};
    return await tauriExists(path, options);
  } else if (isCapacitor) {
    console.log('Capacitor: Checking if file exists', path);
    await CapFilesystem.requestPermissions();
    const result = await CapFilesystem.stat({ path });
    return result.type === 'file';
  }
  throw new Error('Unsupported platform');
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
  if (isTauri) {
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
  } else if (isCapacitor) {
    console.log('Capacitor: Listing files from', dir);
    await CapFilesystem.requestPermissions();
    const entries = await CapFilesystem.readdir({
      path: dir,
    });
    return entries.files.map((file) => ({
      id: file.name,
      name: file.name,
      type: file.type === 'directory' ? 'directory' : getType(file.name),
      size: getSize(file.size),
      modifiedDate: new Date(file.mtime).toLocaleDateString(),
    }));
  }
  throw new Error('Unsupported platform');
}

export async function openFile(): Promise<string> {
  if (isTauri) {
    return await open({ multiple: false, directory: false });
  } else if (isCapacitor) {
    await FilePicker.checkPermissions();
    const result = await FilePicker.pickFiles();
    return result.files[0].path;
  }
  throw new Error('Unsupported platform');
}

export async function openDir(): Promise<string> {
  if (isTauri) {
    return await open({ multiple: false, directory: true });
  } else if (isCapacitor) {
    await FilePicker.checkPermissions();
    const result = await FilePicker.pickDirectory();
    return result.path;
  }
  throw new Error('Unsupported platform');
}

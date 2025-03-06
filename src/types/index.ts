export interface Logger {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logInfo: (msg: string, ...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logError: (msg: string, ...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logWarn: (msg: string, ...args: any[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logDebug: (msg: string, ...args: any[]) => void;
}

export type FileType = 'pdf' | 'note' | 'directory' | 'unknown';

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  byteSize: number;
  modifiedDate: string;
}

export const getFileType = (file: string): FileType => {
  const ext = file.split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'note') return 'note';
  return 'unknown';
};

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

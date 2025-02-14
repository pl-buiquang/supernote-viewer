import type React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/store';
import { useEffect, useState } from 'react';
import { stat, readDir } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import FileViewer from './FileViewer';
import { File, FileText, Folder, MoreVertical, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Breadcrumb } from '@/components/Breadcrumb';

type FileType = 'pdf' | 'note' | 'directory' | 'unknown';

interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size: string;
  modifiedDate: string;
}

const FileIcon: React.FC<{ type: FileType }> = ({ type }) => {
  switch (type) {
    case 'pdf':
      return <File className="h-5 w-5 text-red-500" />;
    case 'note':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'directory':
      return <Folder className="h-5 w-5 text-yellow-500" />;
    default:
      return <HelpCircle className="h-5 w-5 text-gray-500" />;
  }
};

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

export default function FileBrowser() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const { getStoreValue } = useStore();
  const [baseFolder, setBaseFolder] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setBaseFolder(await getStoreValue<string>('baseFolder'));
    })();
  }, []);

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const toggleFileSelection = (id: string) => {
    setSelectedFiles((prev) => (prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]));
    console.log(selectedFiles);
  };
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [loading, setLoading] = useState(true);

  const handleChooseFile = async () => {
    // Open a dialog
    const file = await open({
      multiple: false,
      directory: false,
    });
    setCurrentFile(file);
  };

  useEffect(() => {
    (async () => {
      const storeBaseFolder = await getStoreValue<string>('baseFolder');
      console.log(storeBaseFolder);
      const entries = await readDir(storeBaseFolder, {});
      setBaseFolder(storeBaseFolder);
      console.log(entries);
      const metadata = await Promise.all(entries.map((e) => stat(`${storeBaseFolder}/${e.name}`, {})));
      setFiles(
        metadata.map((m, i) => ({
          id: entries[i].name,
          name: entries[i].name,
          type: m.isDirectory ? 'directory' : getType(entries[i].name),
          size: getSize(m.size),
          modifiedDate: m.atime.toDateString(),
        })),
      );
    })();
  }, [getStoreValue]);

  return (
    <div className="container mx-auto p-4">
      {baseFolder && <Breadcrumb baseFolder={baseFolder} />}
      <div className="grid auto-rows-min gap-4 md:grid-cols-1">
        <Button className="w-full" onClick={handleChooseFile}>
          Choose File
        </Button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Size</th>
            <th className="p-2 text-left">Modified</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id} className="border-b hover:bg-gray-50">
              <td className="p-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={() => toggleFileSelection(file.id)}
                  />
                  <FileIcon type={file.type} />
                  <span>{file.name}</span>
                </div>
              </td>
              <td className="p-2">{file.size}</td>
              <td className="p-2">{file.modifiedDate}</td>
              <td className="p-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Open</DropdownMenuItem>
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
        {currentFile && <FileViewer file={currentFile} />}
      </div>
    </div>
  );
}

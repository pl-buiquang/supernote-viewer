import type React from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { useEffect, useState } from 'react';
import FileViewer from '../components/FileViewer';
import { File, FileText, Folder, MoreVertical, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileItem, FileType, listFiles } from '@/services/platform';
import useCache from '@/hooks/useCache';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import useAppLogger from '@/hooks/useAppLogger';

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

export default function FileBrowser() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const { logInfo } = useAppLogger('file-browser');
  const { store, setStoreValue } = useStore();
  const { deleteCache } = useCache();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await onOpenUrl((urls) => {
        console.log('Received deep link urls', urls);
        if (urls.length > 0) {
          setStoreValue('currentFile', urls[0]);
        }
      });
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!store.baseFolder) return;
      const subPath = store.currentPath.join('/');
      setCurrentFolder(store.baseFolder + (subPath ? '/' + subPath : ''));
    })();
  }, [store.baseFolder, store.currentPath]);

  // const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      logInfo('Listing files from', currentFolder);
      if (!currentFolder) return;
      const files = await listFiles(currentFolder);
      setFiles(files);
    })();
  }, [currentFolder]);

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      await setStoreValue('currentPath', [...store.currentPath, file.name]);
      return;
    } else {
      await setStoreValue('currentFile', currentFolder + '/' + file.name);
    }
  };

  const handleClearCache = async (fileId: string) => {
    logInfo('Clearing cache for', fileId);
    await deleteCache(currentFolder + '/' + fileId);
  };

  return (
    <div className="container mx-auto p-4">
      {store.currentFile ? (
        <div className="min-h-[100vh] flex-1 md:min-h-min md:flex md:justify-center md:items-center">
          {store.currentFile && <FileViewer file={store.currentFile} />}
        </div>
      ) : (
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
                    <FileIcon type={file.type} />
                    <span className="cursor-pointer hover:underline" onClick={() => handleFileClick(file)}>
                      {file.name}
                    </span>
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
                      <DropdownMenuItem onClick={() => handleFileClick(file)}>Open</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleClearCache(file.id)}>Clear cache</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

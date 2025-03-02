import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

import { useStore } from '@/store';
import { Folder } from 'lucide-react';
import FilePicker from './FilePicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import useCache from '@/hooks/useCache';
import { useState } from 'react';

export type AppSidebarProps = {
  openLogs: () => void;
} & React.ComponentProps<typeof Sidebar>;

export default function AppSidebar({ ...props }: AppSidebarProps) {
  const { openLogs } = props;
  const { store, setStoreValue } = useStore();
  const { clearCache } = useCache();
  const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false);

  const handleChooseFolder = async (file: string) => {
    if (file) {
      await setStoreValue('baseFolder', file);
    }
  };

  const handleChooseFile = async (file: string) => {
    await setStoreValue('currentFile', file);
  };

  const handleClearCache = async () => {
    await clearCache();
    setClearCacheModalOpen(false);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-4">
          <h1 className="text-xl font-bold">Supernote Viewer</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup key="main">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="choose-file">
                <SidebarMenuButton asChild>
                  <FilePicker onFilePick={handleChooseFile} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup key="base-folder">
          <SidebarGroupLabel>Root folder</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {store.baseFolder && (
                <SidebarMenuItem key="base-folder">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Folder />
                    <p className="text-sm text-gray-500 truncate ml-0.5" title={store.baseFolder}>
                      {store.baseFolder}
                    </p>
                  </div>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem key="choose-folder">
                <SidebarMenuButton asChild>
                  <FilePicker
                    onFilePick={handleChooseFolder}
                    isFolder
                    title={store.baseFolder ? 'Change root folder' : 'Choose root folder'}
                  />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem key="clear-cache">
            <React.Fragment>
              <SidebarMenuButton asChild>
                <button
                  onClick={() => setClearCacheModalOpen(true)}
                  className="w-full text-left hover:bg-red-300 px-2 py-2 rounded"
                >
                  Clear Cache
                </button>
              </SidebarMenuButton>
              <AlertDialog open={clearCacheModalOpen}>
                <AlertDialogTrigger asChild>
                  <span className="hidden" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all cached data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setClearCacheModalOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearCache} className="bg-red-500 hover:bg-red-600">
                      Clear Cache
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </React.Fragment>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={() => openLogs()} className="text-sm text-gray-500">
                Logs
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="border-t border-gray-200 my-2" />
            <p className="text-sm text-gray-500">
              Version : {__APP_VERSION__}-{__GIT_COMMIT__}
            </p>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

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
import FilePicker from './FilePicker';
import { Link } from 'react-router-dom';
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

export type AppSidebarProps = {} & React.ComponentProps<typeof Sidebar>;

export default function AppSidebar({ ...props }: AppSidebarProps) {
  const { setStoreValue } = useStore();
  const { clearCache } = useCache();
  const [clearCacheModalOpen, setClearCacheModalOpen] = useState(false);

  const handleChooseFolder = async (file: string) => {
    await setStoreValue('baseFolder', file);
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
          <SidebarGroupLabel>Main</SidebarGroupLabel>
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
        <SidebarGroup key="settings">
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key="choose-folder">
                <SidebarMenuButton asChild>
                  <FilePicker onFilePick={handleChooseFolder} isFolder />
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
                  className="w-full text-left bg-red-50 hover:bg-red-100 px-2 py-2 rounded"
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
              <Link to="/logs">
                <span className="text-sm text-gray-500">Logs</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
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

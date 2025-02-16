import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
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

export type AppSidebarProps = {} & React.ComponentProps<typeof Sidebar>;

export default function AppSidebar({ ...props }: AppSidebarProps) {
  const { setStoreValue } = useStore();
  const handleChooseFolder = async (file: string) => {
    await setStoreValue('baseFolder', file);
  };

  const handleChooseFile = async (file: string) => {
    await setStoreValue('currentFile', file);
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="p-4">
          <h1 className="text-xl font-bold">Menu</h1>
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
      <SidebarRail />
    </Sidebar>
  );
}

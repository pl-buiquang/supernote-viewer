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

import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { openDir, openFile } from '@/services/platform';

export type AppSidebarProps = {} & React.ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  const { setStoreValue } = useStore();
  const handleChooseFolder = async () => {
    // Open a dialog
    const file = await openDir();
    await setStoreValue('baseFolder', file);
  };

  const handleChooseFile = async () => {
    // Open a dialog
    const file = await openFile();
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
                  <Button className="w-full" onClick={handleChooseFile}>
                    Open file
                  </Button>
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
                  <Button className="w-full" onClick={handleChooseFolder}>
                    Choose Folder
                  </Button>
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

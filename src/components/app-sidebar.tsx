import * as React from "react"

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
} from "@/components/ui/sidebar"

import { Button } from "@/components/ui/button"
import { open } from '@tauri-apps/plugin-dialog';
  

export type AppSidebarProps = {
  setBaseFolder: (folder: string) => void;
} & React.ComponentProps<typeof Sidebar>


export function AppSidebar({ ...props }: AppSidebarProps) {
  const { setBaseFolder } = props;
  const handleChooseFolder = async () => {
    // Open a dialog
    const file = await open({
      multiple: false,
      directory: true,
    });
    setBaseFolder(file);
  }

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
              <SidebarMenuItem key="choose-folder">
                <SidebarMenuButton asChild>
                  <Button className="w-full" onClick={handleChooseFolder}>Choose Folder</Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
    </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}


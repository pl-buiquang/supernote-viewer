import { AppSidebar } from './components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import FileBrowser from './app/FileBrowser';
import { useIsMobile } from './hooks/use-mobile';
import './index.css';
import { StoreProvider } from './store';
import { AppBreadcrumb } from './components/AppBreadcrumb';

export default function App() {
  useIsMobile();

  return (
    <StoreProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AppBreadcrumb />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
            <FileBrowser />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </StoreProvider>
  );
}

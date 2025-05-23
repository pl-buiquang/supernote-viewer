import AppSidebar from './components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from './hooks/use-mobile';
import './index.css';
import { StoreProvider, useStore } from './store';
import { AppBreadcrumb } from './components/AppBreadcrumb';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import routes from './routes';
import AppLoggerProvider from './components/AppLogger';
import { getCurrent as getCurrentDeepLinkUrls } from '@tauri-apps/plugin-deep-link';
import { useEffect, useState } from 'react';
import LogViewer from './app/LogViewer';
import { TooltipProvider } from './components/ui/tooltip';

const AppWithStore = () => {
  const { store, setStoreValue } = useStore();
  const [openLogs, setOpenLogs] = useState(false);

  if (store.loaded === false) {
    return null;
  }

  return (
    <SidebarProvider
      defaultOpen={store.sideBarOpen}
      open={store.sideBarOpen}
      onOpenChange={(open) => setStoreValue('sideBarOpen', open)}
    >
      <TooltipProvider>
        <Router>
          <AppSidebar openLogs={() => setOpenLogs(true)} />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <AppBreadcrumb />
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
              <Routes>
                {routes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.component} />
                ))}
              </Routes>
              <LogViewer open={openLogs} onClose={() => setOpenLogs(false)} />
            </div>
          </SidebarInset>
        </Router>
      </TooltipProvider>
    </SidebarProvider>
  );
};

export default function App() {
  const [initialFile, setInitialFile] = useState<string | null>(null);

  useIsMobile();

  useEffect(() => {
    (async () => {
      const urls = await getCurrentDeepLinkUrls();
      if (urls?.length > 0) {
        setInitialFile(urls[0]);
      }
    })();
  }, []);

  return (
    <AppLoggerProvider>
      <StoreProvider initialFile={initialFile}>
        <AppWithStore />
      </StoreProvider>
    </AppLoggerProvider>
  );
}

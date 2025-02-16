import AppSidebar from './components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from './hooks/use-mobile';
import './index.css';
import { StoreProvider } from './store';
import { AppBreadcrumb } from './components/AppBreadcrumb';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import routes from './routes';
import AppLoggerProvider from './components/AppLogger';

export default function App() {
  useIsMobile();

  return (
    <AppLoggerProvider>
      <StoreProvider>
        <SidebarProvider>
          <Router>
            <AppSidebar />
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
              </div>
            </SidebarInset>
          </Router>
        </SidebarProvider>
      </StoreProvider>
    </AppLoggerProvider>
  );
}

import FileBrowser from './app/FileBrowser';
import LogViewer from './app/LogViewer';

const routes = [
  {
    path: '/',
    component: <FileBrowser />,
  },
  {
    path: '/logs',
    component: <LogViewer />,
  },
];

export default routes;

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store';

export function AppBreadcrumb() {
  const { store, setStoreValue } = useStore();
  const { baseFolder, currentPath, currentFile } = store;
  const currentFullPath = [baseFolder, ...currentPath].join('/') + '/';

  const handleHomeClick = async () => {
    await setStoreValue('currentPath', []);
    await setStoreValue('currentFile', null);
  };

  const handlePathClick = async (index: number) => {
    await setStoreValue('currentPath', currentPath.slice(0, index));
    await setStoreValue('currentFile', null);
  };

  return (
    <Breadcrumb>
      <BreadcrumbList className="break-all">
        <BreadcrumbItem className="md:block">
          <BreadcrumbLink href="#" onClick={handleHomeClick}>
            {baseFolder}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {currentPath.map((item, i) => (
          <>
            <BreadcrumbSeparator className="md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <BreadcrumbLink onClick={() => handlePathClick(i)}>{item}</BreadcrumbLink>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ))}
        {currentFile && (
          <>
            <BreadcrumbSeparator className="md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <BreadcrumbLink>
                  {currentFile.startsWith(currentFullPath)
                    ? currentFile.substring(currentFullPath.length)
                    : currentFile}
                </BreadcrumbLink>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

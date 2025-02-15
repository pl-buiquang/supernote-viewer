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
  const { baseFolder, currentPath } = store;

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
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#" onClick={handleHomeClick}>
            {baseFolder}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {currentPath.map((item, i) => (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>
                <BreadcrumbLink onClick={() => handlePathClick(i)}>{item}</BreadcrumbLink>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

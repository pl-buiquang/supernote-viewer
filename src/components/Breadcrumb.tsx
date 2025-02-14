import { ChevronRight, Home, Link } from 'lucide-react';

interface BreadcrumbProps {
  baseFolder: string;
  path?: string[];
}

export function Breadcrumb({ baseFolder, path }: BreadcrumbProps) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Home className="w-4 h-4 mr-2" />
          <span>{baseFolder}</span>
        </li>
        {(path || []).map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link
                href={`/file-browser/${path.slice(0, index + 1).join('/')}`}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
              >
                {item}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

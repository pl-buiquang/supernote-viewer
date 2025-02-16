import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useAppLogger from '@/hooks/useAppLogger';
import { Link } from 'react-router-dom';

export default function LogViewer() {
  const { logs } = useAppLogger();
  return (
    <div className="flex flex-col flex-1 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Log Viewer</h1>
        <Link to="/">
          <Button variant="outline">Back to Main App</Button>
        </Link>
      </div>
      <div className="flex flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelClass(log.level)}`}>
                    {log.level}
                  </span>
                </TableCell>
                <TableCell>{log.component}</TableCell>
                <TableCell className="break-words max-w-xs">{log.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function getLevelClass(level: string) {
  switch (level) {
    case 'INFO':
      return 'bg-blue-100 text-blue-800';
    case 'WARN':
      return 'bg-yellow-100 text-yellow-800';
    case 'ERROR':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

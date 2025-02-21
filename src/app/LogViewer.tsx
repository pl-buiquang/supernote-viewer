import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useAppLogger from '@/hooks/useAppLogger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type LogViewerProps = {
  open: boolean;
  onClose: () => void;
};

export default function LogViewer(props: LogViewerProps) {
  const { open, onClose } = props;
  const { logs } = useAppLogger();

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Log Viewer</DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 w-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Component</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...logs].reverse().map((log, index) => (
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
      </DialogContent>
    </Dialog>
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

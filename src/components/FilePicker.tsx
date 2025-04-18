import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import usePlatform from '@/hooks/usePlatform';

type FilePickerProps = {
  onFilePick: (file: string) => Promise<void>;
  isFolder?: boolean;
  title?: string;
};

export default function FilePicker(props: FilePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const platform = usePlatform();
  const { onFilePick, isFolder, title } = props;
  const buttonTitle = title ? title : isFolder ? 'Choose Folder' : 'Open File';

  const handleOk = async () => {
    await onFilePick(inputValue);
    setIsOpen(false);
    setInputValue('');
  };

  const handleCancel = () => {
    setIsOpen(false);
    setInputValue('');
  };

  const handleNativeChooseFile = async () => {
    const file = await (isFolder ? platform.openDir() : platform.openFile());
    await onFilePick(file);
  };

  if (!platform.isMobile || !isFolder) {
    // if (!withTauri) {
    //   return (
    //     <input
    //       type="file"
    //       onChange={async (e) => {
    //         const file = e.target.files?.[0];
    //         if (file) {
    //           await onFilePick(file);
    //         }
    //       }}
    //     />
    //   );
    // }
    return (
      <Button className="w-full" onClick={handleNativeChooseFile}>
        {buttonTitle}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="outline">
          {buttonTitle}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter a folder path</DialogTitle>
          <DialogDescription>Type a valid android path</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="string-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type the path here"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleOk}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

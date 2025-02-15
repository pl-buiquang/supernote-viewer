import { useEffect, useMemo, useState } from 'react';
import { exportNote } from '@/services/noteViewer';
import { Image } from 'image-js';

type FileViewerProps = {
  file: string;
};

export default function PdfViewer(props: FileViewerProps) {
  const [images, setImages] = useState<Image[]>(null);
  const { file } = props;
  const currentFile = useMemo(() => file, [file]);

  useEffect(() => {
    console.log(currentFile);
    (async () => {
      if (currentFile) {
        const images = await exportNote(currentFile);
        setImages(images);
      }
    })();
  }, [currentFile]);

  if (images) {
    return (
      <>
        {images.map((image, i) => (
          <img key={i} src={image.toDataURL()} alt={`Page ${i}`} />
        ))}
      </>
    );
  }

  return <div>Loading ...</div>;
}

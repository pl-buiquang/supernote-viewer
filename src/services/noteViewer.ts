import { readFile } from '@tauri-apps/plugin-fs';
import { SupernoteX, toImage } from 'supernote-typescript';
import { Image } from 'image-js';

export async function exportNote(notePath: string): Promise<Image[]> {
  const noteData = await readFile(notePath);
  const note = new SupernoteX(new Uint8Array(noteData.buffer));
  const markedPdfPageNumbers = Object.keys(note.footer.PAGE);

  const previousJsonMarkInfo = {};

  const jsonMarkInfo = note.pages
    .map((page, i) => {
      return {
        pageNumber: markedPdfPageNumbers[i],
        index: i,
        marksCount: parseInt(page.TOTALPATH),
      };
    })
    .reduce(
      (acc, curr) => {
        acc[curr.pageNumber] = curr;
        return acc;
      },
      {} as Record<string, { pageNumber: string; index: number; marksCount: number }>,
    );
  const updatedOrNewPages = Object.keys(jsonMarkInfo)
    .filter((page) => previousJsonMarkInfo[page]?.marksCount !== jsonMarkInfo[page].marksCount)
    .map((page) => jsonMarkInfo[page]);
  const updateOrNewPagesIndexes = updatedOrNewPages.map((page) => page.index);
  const numPages = markedPdfPageNumbers.length;
  const pagesToExtract = Array.from({ length: numPages }, (_, i) => i + 1).filter((page) =>
    updateOrNewPagesIndexes.includes(page - 1),
  );
  console.log(`Extracting pages ${pagesToExtract} from the mark file...`);
  const markImages = await toImage(note, pagesToExtract);
  console.log(`Extracted ${pagesToExtract.length} pages from the mark file.`);

  return markImages;
}

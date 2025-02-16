import { readFile } from '@tauri-apps/plugin-fs';
import { SupernoteX, toImage } from 'supernote-typescript';
import { Image } from 'image-js';
import { NotePageCache, NotePageExtractInfo } from '@/store';

export async function exportNote(
  notePath: string,
  previousExtractInfo?: NotePageCache,
): Promise<{
  images: Image[];
  extractInfo: NotePageExtractInfo<{ imageIndex?: number }>[];
}> {
  const noteData = await readFile(notePath);
  const note = new SupernoteX(new Uint8Array(noteData.buffer));
  const markedPdfPageNumbers = Object.keys(note.footer.PAGE);

  const previousJsonMarkInfo = previousExtractInfo || { pages: [], lastViewedPage: 0 };

  const jsonMarkInfo = note.pages.map((page, i) => {
    return {
      pageNumber: markedPdfPageNumbers[i],
      index: i,
      marksCount: parseInt(page.TOTALPATH),
    };
  });
  const updatedOrNewPages = jsonMarkInfo.filter(
    (page) =>
      previousJsonMarkInfo.pages.find((existingPage) => existingPage.pageNumber === page.pageNumber)?.marksCount !==
      page.marksCount,
  );
  const updateOrNewPagesIndexes = updatedOrNewPages.map((page) => page.index);
  const numPages = markedPdfPageNumbers.length;
  const pagesToExtract = Array.from({ length: numPages }, (_, i) => i + 1).filter((page) =>
    updateOrNewPagesIndexes.includes(page - 1),
  );
  console.log(`Extracting pages ${pagesToExtract} from the mark file...`);
  const markImages = await toImage(note, pagesToExtract);
  console.log(`Extracted ${pagesToExtract.length} pages from the mark file.`);

  const updatedMarkInfo = jsonMarkInfo.map((page) => {
    const info: NotePageExtractInfo<{ imageIndex?: number }> = { ...page };
    const markImageIndex = pagesToExtract.indexOf(page.index + 1);
    if (markImageIndex !== -1) {
      info.imageIndex = markImageIndex;
    }
    return info;
  });
  return { images: markImages, extractInfo: updatedMarkInfo };
}

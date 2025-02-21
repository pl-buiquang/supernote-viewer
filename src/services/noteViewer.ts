import { readFile } from '@/services/platform';
import { SupernoteX } from 'supernote-typescript';
import { Image } from 'image-js';
import { NotePageCache, NotePageExtractInfo } from '@/store';
import { extractImages } from './imageExtractor';

export async function exportNote(
  notePath: string,
  previousExtractInfo?: NotePageCache,
  logger: (msg: string) => void = console.log,
): Promise<{
  note: SupernoteX;
  images: Image[];
  extractInfo: NotePageExtractInfo<{ imageIndex?: number }>[];
}> {
  const noteData = await readFile(notePath);
  const note = new SupernoteX(new Uint8Array(noteData));
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
  logger(`Extracting pages ${pagesToExtract} from the mark file...`);
  const markImages = await extractImages(note, pagesToExtract);
  logger(`Extracted ${pagesToExtract.length} pages from the mark file.`);

  const updatedMarkInfo = jsonMarkInfo.map((page) => {
    const info: NotePageExtractInfo<{ imageIndex?: number }> = { ...page };
    const markImageIndex = pagesToExtract.indexOf(page.index + 1);
    if (markImageIndex !== -1) {
      info.imageIndex = markImageIndex;
    }
    return info;
  });
  return { note, images: markImages, extractInfo: updatedMarkInfo };
}

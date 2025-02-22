import { SupernoteX } from 'supernote-typescript';
import { Image } from 'image-js';
import { NotePageCache, NotePageExtractInfo } from '@/store';
import { extractImages } from './imageExtractor';
import { Platform } from './platform';
import { Logger } from '@/hooks/useAppLogger';

export async function exportNote(
  platform: Platform,
  notePath: string,
  previousExtractInfo: NotePageCache | undefined,
  logger: Logger,
): Promise<{
  note: SupernoteX;
  images: Image[];
  extractInfo: NotePageExtractInfo<{ imageIndex?: number }>[];
}> {
  const noteData = await platform.readFile(notePath);
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
  logger.logInfo(`Extracting pages ${pagesToExtract} from the mark file...`);
  const markImages = await extractImages(note, pagesToExtract, logger);
  logger.logInfo(`Extracted ${pagesToExtract.length} pages from the mark file.`);

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

export const extractPageRefFromTitle = (title: string) => {
  const match = title.match(/^(\d{4})/);
  return match ? parseInt(match[1]) : null;
};

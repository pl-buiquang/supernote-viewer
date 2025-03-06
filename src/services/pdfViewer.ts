import { PDFDict, PDFDocument, PDFName, PDFRef, PDFStream } from 'pdf-lib';
import { SupernoteX } from 'supernote-typescript';
import pako from 'pako';
import { extractImages } from './imageExtractor';
import { Logger } from '@/types';
import { IPlatform } from './platform/index';

export async function exportPdf(
  platform: IPlatform,
  pdfPath: string,
  markFile: string,
  isPdfPathCached: boolean,
  logger: Logger,
): Promise<Uint8Array> {
  const pdfData = await platform.readFile(pdfPath, isPdfPathCached);
  const pdfDoc = await PDFDocument.load(pdfData);

  const markData = await platform.readFile(markFile);
  const note = new SupernoteX(new Uint8Array(markData));
  const markedPdfPageNumbers = Object.keys(note.footer.PAGE);

  let previousJsonMarkInfo: Record<string, { pageNumber: string; index: number; marksCount: number }> = {};
  const markObjectRef = pdfDoc.catalog.context
    .enumerateIndirectObjects()
    .find(
      (e) =>
        e[1] instanceof PDFDict &&
        (e[1].get(PDFName.of('Type')) as PDFName)?.asString() === '/Filespec' &&
        (e[1].get(PDFName.of('F')) as PDFName)?.asString() === 'marks.json',
    );

  if (markObjectRef) {
    const markData = pdfDoc.context.lookupMaybe(
      ((markObjectRef[1] as PDFDict).get(PDFName.of('EF')) as PDFDict).get(PDFName.of('F')),
      PDFStream,
    );
    if (markData) {
      const content = pako.inflate(markData.getContents());
      previousJsonMarkInfo = JSON.parse(new TextDecoder().decode(content));
      logger.logInfo(`Found marks.json file attachmen ${previousJsonMarkInfo}`);
    }
  }

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
  logger.logInfo(`Extracting pages ${pagesToExtract} from the mark file...`);
  const markImages = await extractImages(note, pagesToExtract, logger);
  logger.logInfo(`Extracted ${pagesToExtract.length} pages from the mark file.`);

  await Promise.all(
    markImages.map(async (image, i) => {
      const pdfPageIndex = updatedOrNewPages[i].pageNumber;
      logger.logInfo(`Marking page ${pdfPageIndex}...`);
      const pdfPage = pdfDoc.getPage(parseInt(pdfPageIndex) - 1);
      const { width, height } = pdfPage.getSize();
      const markImageBytes = image.toBuffer();
      const markImage = await pdfDoc.embedPng(markImageBytes);
      pdfPage.drawImage(markImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
      logger.logInfo(`Marked page ${pdfPageIndex}.`);
    }),
  );

  if (markObjectRef) {
    pdfDoc.context.delete(
      ((markObjectRef[1] as PDFDict).get(PDFName.of('EF')) as PDFDict).get(PDFName.of('F')) as PDFRef,
    );
    pdfDoc.context.delete(markObjectRef[0]);
    logger.logInfo('Deleted previous marks.json file attachment');
  }

  await pdfDoc.attach(new TextEncoder().encode(JSON.stringify(jsonMarkInfo)), 'marks.json', {
    mimeType: 'application/json',
    description: 'Marks data',
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  logger.logInfo('Saving new PDF...');
  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}

export async function exportPdfTo(
  platform: IPlatform,
  pdfPath: string,
  markFile: string,
  outputPdfPath: string,
  isPdfPathCached: boolean,
  logger: Logger,
) {
  const markedPdfData = await exportPdf(platform, pdfPath, markFile, isPdfPathCached, logger);
  await platform.writeFile(outputPdfPath, markedPdfData);
  return outputPdfPath;
}

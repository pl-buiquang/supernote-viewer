import { PDFDict, PDFDocument, PDFName, PDFRef, PDFStream } from 'pdf-lib';
import { SupernoteX, toImage } from 'supernote-typescript';
import pako from 'pako';
import { readFile, writeFile } from './platform';

export async function exportPdf(
  pdfPath: string,
  markFile: string,
  isPdfPathCached: boolean,
  logMsg?: (msg: string) => void,
): Promise<Uint8Array> {
  const pdfData = await readFile(pdfPath, isPdfPathCached);
  const pdfDoc = await PDFDocument.load(pdfData);

  const markData = await readFile(markFile);
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
      logMsg(`Found marks.json file attachmen ${previousJsonMarkInfo}`);
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
  logMsg(`Extracting pages ${pagesToExtract} from the mark file...`);
  const markImages = await toImage(note, pagesToExtract);
  logMsg(`Extracted ${pagesToExtract.length} pages from the mark file.`);

  await Promise.all(
    markImages.map(async (image, i) => {
      const pdfPageIndex = updatedOrNewPages[i].pageNumber;
      logMsg(`Marking page ${pdfPageIndex}...`);
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
      logMsg(`Marked page ${pdfPageIndex}.`);
    }),
  );

  if (markObjectRef) {
    pdfDoc.context.delete(
      ((markObjectRef[1] as PDFDict).get(PDFName.of('EF')) as PDFDict).get(PDFName.of('F')) as PDFRef,
    );
    pdfDoc.context.delete(markObjectRef[0]);
    logMsg('Deleted previous marks.json file attachment');
  }

  await pdfDoc.attach(new TextEncoder().encode(JSON.stringify(jsonMarkInfo)), 'marks.json', {
    mimeType: 'application/json',
    description: 'Marks data',
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  logMsg('Saving new PDF...');
  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}

export async function exportPdfTo(
  pdfPath: string,
  markFile: string,
  outputPdfPath: string,
  isPdfPathCached: boolean,
  logMsg?: (msg: string) => void,
) {
  const markedPdfData = await exportPdf(pdfPath, markFile, isPdfPathCached, logMsg);
  await writeFile(outputPdfPath, markedPdfData);
  return outputPdfPath;
}

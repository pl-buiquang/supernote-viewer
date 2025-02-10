import { PDFDict, PDFDocument, PDFName, PDFRef, PDFStream } from 'pdf-lib';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { SupernoteX, toImage } from 'supernote-typescript';
import pako from 'pako';

export async function exportPdf(pdfPath: string, markFile?: string, outputPdfPath?: string) {   
  const markFilepath = markFile || `${pdfPath}.mark`;
  const outputFilename = outputPdfPath || `${pdfPath.replace('.pdf', '')}.marked.pdf`;
  const pdfData = await readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfData);

  const markData = await readFile(markFilepath);
  const note = new SupernoteX(new Uint8Array(markData.buffer))
  const markedPdfPageNumbers = Object.keys(note.footer.PAGE)

  let previousJsonMarkInfo: Record<string, {pageNumber: string, index: number, marksCount: number}> = {}
  const markObjectRef = pdfDoc.catalog.context.enumerateIndirectObjects().find((e, i) => 
    e[1] instanceof PDFDict && (e[1].get(PDFName.of('Type')) as PDFName)?.asString() === "/Filespec" && 
      (e[1].get(PDFName.of('F')) as PDFName)?.asString() === "marks.json"
  )

  if (markObjectRef) {
    const markData = pdfDoc.context.lookupMaybe(((markObjectRef[1] as PDFDict).get(PDFName.of('EF')) as PDFDict).get(PDFName.of("F")), PDFStream)
    if (markData) {
      const content = pako.inflate(markData.getContents())
      previousJsonMarkInfo = JSON.parse(new TextDecoder().decode(content))
      console.log("Found marks.json file attachment", previousJsonMarkInfo)
    }
  }  
  
  const jsonMarkInfo = note.pages.map((page, i) => {
    return {
      pageNumber: markedPdfPageNumbers[i],
      index: i,
      marksCount: parseInt(page.TOTALPATH)
    }
  }).reduce((acc, curr) => {
    acc[curr.pageNumber] = curr
    return acc
  }, {} as Record<string, {pageNumber: string, index: number, marksCount: number}>)
  const updatedOrNewPages = Object.keys(jsonMarkInfo)
    .filter((page) => previousJsonMarkInfo[page]?.marksCount !== jsonMarkInfo[page].marksCount)
    .map((page) => jsonMarkInfo[page])
  const updateOrNewPagesIndexes = updatedOrNewPages.map((page) => page.index)
  const numPages = markedPdfPageNumbers.length 
  const pagesToExtract = Array.from({length: numPages}, (_, i) => i + 1).filter((page) => updateOrNewPagesIndexes.includes(page - 1))
  console.log(`Extracting pages ${pagesToExtract} from the mark file...`);
  const markImages = await toImage(note, pagesToExtract);
  console.log(`Extracted ${pagesToExtract.length} pages from the mark file.`);

  await Promise.all(markImages.map(async (image, i) => {
    const pdfPageIndex = updatedOrNewPages[i].pageNumber
    console.log(`Marking page ${pdfPageIndex}...`);
    const pdfPage = pdfDoc.getPage(parseInt(pdfPageIndex) - 1);
    const { width, height } = pdfPage.getSize(); 
    const markImageBytes = image.toBuffer()
    const markImage = await pdfDoc.embedPng(markImageBytes);
    pdfPage.drawImage(markImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    console.log(`Marked page ${pdfPageIndex}.`);
  }));

  if (markObjectRef) {
    pdfDoc.context.delete(((markObjectRef[1] as PDFDict).get(PDFName.of('EF')) as PDFDict).get(PDFName.of("F")) as PDFRef)
    pdfDoc.context.delete(markObjectRef[0])
    console.log("Deleted previous marks.json file attachment")
  }

  await pdfDoc.attach(new TextEncoder().encode(JSON.stringify(jsonMarkInfo)), 'marks.json', {
    mimeType: 'application/json',
    description: 'Marks data',
    creationDate: new Date(),
    modificationDate: new Date(),
  })

  console.log("Saving new PDF...");
  const modifiedPdfBytes = await pdfDoc.save();
  await writeFile(outputFilename, modifiedPdfBytes);
  console.log(`New PDF saved as: ${outputFilename}`);
  return outputFilename;
}

import { PDFDocument } from 'pdf-lib';
import { fromBuffer } from 'pdf2pic';
import { Image } from 'image-js';
import { toImage } from 'supernote-typescript';
import fs from 'fs-extra';
import path from 'path';
import { BaseImageExtractor, CacheFile, PageExtractInfo } from './baseImageExtractor.js';
import { pdfMarkdownConfig } from './pdfConfig.js';

/**
 * Extracts images from a PDF file with marks, using caching support
 */
export class PdfImageExtractor extends BaseImageExtractor {
  private pdfDoc: PDFDocument;
  private markFilePath: string;
  private markModTime: number;
  private imageScale: number = 2;

  /**
   * Constructor for the PDF image extractor
   * @param inputFile Path to the input PDF file
   * @param markFilePath Path to the mark file
   * @param mediaFolder Optional folder to save extracted images
   * @param cacheFilePath Optional path to the cache file
   */
  constructor(
    inputFile: string,
    mediaFolder?: string,
    outputFolder?: string,
    cacheFilePath?: string,
    useCache?: boolean,
  ) {
    super(inputFile, mediaFolder, outputFolder, cacheFilePath, 'pdfs', useCache);

    this.markFilePath = this.getNoteFile(inputFile);

    // Get mark file stats for modification time
    const markStats = fs.statSync(this.markFilePath);
    this.markModTime = markStats.mtimeMs;
    this.fileModTime = Math.max(this.fileModTime, this.markModTime);
  }

  protected getNoteFile(inputFile: string): string {
    const markFilePath = `${inputFile}.mark`;
    if (!fs.existsSync(markFilePath)) {
      console.error(`Error: Mark file '${markFilePath}' does not exist for PDF file '${this.inputFile}'.`);
      process.exit(1);
    }
    return markFilePath;
  }

  /**
   * Initializes the PDF document and note
   */
  protected async initialize(): Promise<void> {
    // Read the PDF file
    const pdfBuffer = await fs.readFile(this.inputFile);
    this.pdfDoc = await PDFDocument.load(pdfBuffer);
  }

  /**
   * Gets the current page information from the PDF and mark file
   */
  protected async getNotePagesInfo(): Promise<PageExtractInfo[]> {
    // Get the marked PDF page numbers from the note file
    const markedPdfPageNumbers = Object.keys(this.note.footer.PAGE).map((pageNum) => parseInt(pageNum));

    // Create page information for marked pages
    return this.note.pages.map((page, i) => ({
      pageNumber: markedPdfPageNumbers[i],
      index: i,
      marksCount: parseInt(page.TOTALPATH),
    }));
  }

  /**
   * Extracts and saves images for the specified pages
   */
  protected async extractAndSaveImages(pagesToExtract: PageExtractInfo[]): Promise<Record<number, string>> {
    console.log(`Extracting ${pagesToExtract.length} marked pages from ${this.inputFile}...`);

    const pageToImageMap: Record<number, string> = {};

    for (const page of pagesToExtract) {
      try {
        const pdfPageIndex = parseInt(page.pageNumber as string, 10) - 1;

        // Create a new PDF document with just this page
        const singlePagePdf = await PDFDocument.create();
        console.log(`Copying page ${page.pageNumber} from ${this.inputFile}...`);
        const [copiedPage] = await singlePagePdf.copyPages(this.pdfDoc, [pdfPageIndex]);
        console.log(`Copied page ${page.pageNumber} from ${this.inputFile}`);
        singlePagePdf.addPage(copiedPage);
        console.log(`Added page ${page.pageNumber} to new PDF`);

        // Get the original page dimensions
        const pdfPage = this.pdfDoc.getPage(pdfPageIndex);
        const { width, height } = pdfPage.getSize();

        // Apply mark image to the PDF page
        if (parseInt(this.note.pages[page.index].TOTALPATH) > 0) {
          console.log(`Applying marks to page ${page.pageNumber}...`);
          // Convert mark data to image
          const markImages = await toImage(this.note, [page.index + 1]);
          if (markImages && markImages[0]) {
            const markImageBytes = markImages[0].toBuffer();
            const markImage = await singlePagePdf.embedPng(markImageBytes);
            // Draw the mark image on the PDF page
            copiedPage.drawImage(markImage, {
              x: 0,
              y: 0,
              width: width,
              height: height,
            });
            console.log(`Applied marks to page ${page.pageNumber}`);
          }
        }

        // Convert the single page PDF to bytes
        const pdfBytes = await singlePagePdf.save();
        console.log(`Saved page ${page.pageNumber} as PDF bytes (${pdfBytes.length} bytes)`);

        // Convert PDF to PNG using pdf2pic
        try {
          const options = {
            density: 300, // output image quality DPI
            format: 'png', // output format
            width: width * this.imageScale, // use original width
            height: height * this.imageScale, // use original height
            savePath: this.outputDir, // Save directly to output directory
            saveFilename: `${this.baseName}_page_${page.pageNumber}`, // Use our naming convention
          };

          const pdfBuffer = Buffer.from(pdfBytes);
          const converter = fromBuffer(pdfBuffer, options);
          // Try using the direct image save approach first
          console.log(`Converting page ${page.pageNumber} to PNG using direct save...`);
          const result = await converter(1); // This should save the file directly
          if (result && result.path) {
            console.log(`Saved image for page ${page.pageNumber}: ${result.path}`);
            pageToImageMap[page.pageNumber] = result.path;
            continue; // Skip the rest of the loop if this worked
          } else {
            console.log(`Direct save failed for page ${page.pageNumber}, trying buffer approach...`);
          }
          // If direct save failed, try the buffer approach
          const bufferResult = await converter(1, { responseType: 'buffer' });
          if (!bufferResult.buffer || bufferResult.buffer.length === 0) {
            // Try base64 approach if buffer is empty
            console.log(`Buffer is empty for page ${page.pageNumber}, trying base64 approach...`);
            const base64Result = await converter(1, { responseType: 'base64' });
            if (!base64Result.base64) {
              throw new Error(`Failed to convert page ${page.pageNumber} to PNG: All conversion methods failed`);
            }
            // Convert base64 to buffer
            const base64Data = base64Result.base64.replace(/^data:image\/png;base64,/, '');
            const imgBuffer = Buffer.from(base64Data, 'base64');
            // Save the image directly
            const imageFileName = `${this.baseName}_page_${page.pageNumber}.png`;
            const imageFilePath = path.join(this.outputDir, imageFileName);
            await fs.writeFile(imageFilePath, imgBuffer);
            pageToImageMap[page.pageNumber] = imageFilePath;
            console.log(`Saved image for page ${page.pageNumber} using base64 approach: ${imageFilePath}`);
            continue;
          }
          console.log(`Converted page ${page.pageNumber} to PNG (buffer size: ${bufferResult.buffer.length} bytes)`);
          // Load the PNG buffer as an Image
          const image = await Image.load(bufferResult.buffer);
          console.log(`Loaded image for page ${page.pageNumber} (width: ${image.width}, height: ${image.height})`);
          // Save the image
          const imageFileName = `${this.baseName}_page_${page.pageNumber}.png`;
          const imageFilePath = path.join(this.outputDir, imageFileName);
          await image.save(imageFilePath);
          pageToImageMap[page.pageNumber] = imageFilePath;
          console.log(`Saved image for page ${page.pageNumber}: ${imageFilePath}`);
        } catch (conversionError) {
          console.error(`Error converting page ${page.pageNumber} to PNG:`, conversionError);
          // Try a fallback approach - save the PDF directly
          console.log(`Trying fallback approach for page ${page.pageNumber}...`);
          const pdfFileName = `${this.baseName}_page_${page.pageNumber}.pdf`;
          const pdfFilePath = path.join(this.outputDir, pdfFileName);
          await fs.writeFile(pdfFilePath, pdfBytes);
          console.log(`Saved PDF for page ${page.pageNumber}: ${pdfFilePath}`);
          // Note: We're not adding this to pageToImageMap since it's not an image
          // This is just to preserve the content in some form
        }
      } catch (error) {
        console.error(`Error processing page ${page.pageNumber}:`, error);
        // Continue with the next page instead of failing the entire process
      }
    }

    return pageToImageMap;
  }

  /**
   * Updates the cache with new page information
   */
  protected async updateCache(
    cache: CacheFile,
    currentPageInfo: PageExtractInfo[],
    pageToImageMap: Record<number, string>,
  ): Promise<void> {
    // Update cache with new information
    const updatedPageInfo = currentPageInfo.map((page) => ({
      ...page,
      imageFilePath: pageToImageMap[page.pageNumber],
      lastModified: this.fileModTime,
    }));

    // Ensure the pdfs cache exists
    if (!cache.pdfs) {
      cache.pdfs = {};
    }

    cache.pdfs[this.fileKey] = {
      filePath: this.fileKey,
      lastModified: Math.max(this.fileModTime, this.markModTime),
      pages: updatedPageInfo,
    };

    // Save updated cache
    await this.saveCache(cache);
  }

  /**
   * Overrides the base generateMarkdown method to create multiple markdown files
   * based on the configuration in pdfConfig.ts
   * @param imageFilePaths Array of image file paths
   * @returns A summary string of the generated markdown files
   */
  protected async generateMarkdown(
    pageToImageMap: Record<number, string>,
    newOrUpdatePages: Array<string | number>,
  ): Promise<void> {
    // Convert imageFilePaths array to a page number to image path map

    const generatedFiles: string[] = [];

    // Process all configuration sections (year, quarters, months, weeks, days)
    for (const sectionName of Object.keys(pdfMarkdownConfig)) {
      const section = pdfMarkdownConfig[sectionName];

      if (sectionName === 'reflect') {
        // Process all reflect items in the section (should be only one)
        for (const configItem of section) {
          if (!configItem || !configItem.pageNumbers || configItem.pageNumbers.length === 0) {
            continue;
          }

          // Create a new PDF document for all pages
          const reflectPdf = await PDFDocument.create();

          // Add each page to the PDF
          for (const pageNumber of configItem.pageNumbers) {
            if (!pageToImageMap[pageNumber]) continue;

            // Load the image
            const imageData = await fs.readFile(pageToImageMap[pageNumber]);
            const image = await reflectPdf.embedPng(imageData);

            // Add a page with the same dimensions as the image
            const page = reflectPdf.addPage([image.width, image.height]);

            // Draw the image on the page
            page.drawImage(image, {
              x: 0,
              y: 0,
              width: image.width,
              height: image.height,
            });
          }

          // Save the PDF
          const pdfFileName = `${configItem.title}.pdf`;
          const pdfFilePath = path.join(this.mdOutputFolder, pdfFileName);
          const pdfBytes = await reflectPdf.save();
          await fs.writeFile(pdfFilePath, pdfBytes);

          generatedFiles.push(pdfFilePath);
        }
      } else {
        // Each section is an array of config items
        for (const configItem of section) {
          // Get the title from the config
          const { title, useTemplate = false } = configItem;

          const pageNumbers = configItem.pageNumbers || [];

          // Skip if no page numbers defined
          if (!pageNumbers || pageNumbers.length === 0) {
            continue;
          }

          // Create markdown content for this config item
          let mdContent = `---\n`;
          let hasValidImages = false;
          let shouldBeUpdated = false;

          // Add image links for each page number
          for (const pageNumber of pageNumbers) {
            // Skip if no image file path for this page
            if (!pageToImageMap[pageNumber]) continue;

            // We found at least one valid image
            hasValidImages = true;

            if (newOrUpdatePages.includes(pageNumber)) {
              shouldBeUpdated = true;
            }

            // Get the relative path from the markdown file to the image
            const relativePath = encodeURI(path.relative(path.dirname(this.outputDir), pageToImageMap[pageNumber]));
            mdContent += `\n`;
            mdContent += `![Page ${pageNumber}|900](${relativePath.replace(/\\/g, '/')})\n`;
          }

          // Only proceed if at least one image exists
          if (hasValidImages && shouldBeUpdated) {
            // Create the markdown file name with the title
            const mdFileName = `${title}.md`;
            const mdFilePath = path.join(this.mdOutputFolder, mdFileName);

            // Define start and end markers for generated content
            const startMarker = '<!-- BEGIN SUPERNOTE PLANNER CONTENT -->';
            const endMarker = '<!-- END SUPERNOTE PLANNER CONTENT -->';
            const markedContent = `${startMarker}\n\n${mdContent}\n${endMarker}`;

            // Check if file exists and read its content
            let finalContent = '';
            if (fs.existsSync(mdFilePath)) {
              const existingContent = fs.readFileSync(mdFilePath, 'utf8');

              // Find existing generated content section
              const startIndex = existingContent.indexOf(startMarker);
              const endIndex = existingContent.indexOf(endMarker);

              if (startIndex !== -1 && endIndex !== -1) {
                // Replace existing generated content
                finalContent =
                  existingContent.substring(0, startIndex) +
                  markedContent +
                  existingContent.substring(endIndex + endMarker.length);
                console.log(`Replaced generated content in: ${mdFilePath}`);
              } else {
                // No existing generated content, append new content
                finalContent = existingContent + '\n' + markedContent;
                console.log(`Added new generated content to: ${mdFilePath}`);
              }
            } else {
              // Create new content with template if specified
              if (useTemplate) {
                const date = new Date(title);
                const year = date.getFullYear();
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                const weekNumber = String(
                  Math.ceil(
                    (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
                  ),
                ).padStart(2, '0');
                const month = date.toLocaleString('fr-FR', { month: 'long' });

                finalContent = `# ${title}  [[journal/${year}-W${weekNumber}|Week ${weekNumber}]] | [[journal/${year}-${month}|${month}]] | [[journal/${year}-Q${quarter}|Q${quarter}]] | [[journal/${year}|${year}]]\n\n---\n\n\n\n${markedContent}`;
              } else {
                finalContent = markedContent;
              }
              console.log(`Creating new file with generated content: ${mdFilePath}`);
            }

            // Write the final content to file
            fs.writeFileSync(mdFilePath, finalContent);
            generatedFiles.push(mdFilePath);

            // Add to the list of generated files
            generatedFiles.push(mdFilePath);
          }
          //  else {
          //   if (!hasValidImages) {
          //     console.log(`Skipping markdown file for "${title}" as no valid images were found.`);
          //   } else {
          //     console.log(`Skipping markdown file for "${title}" as there is no new image to update.`);
          //   }
          // }
        }
      }
    }

    // Return a summary string instead of the array
    console.log(`Generated ${generatedFiles.length} markdown files based on configuration.`);
  }
}

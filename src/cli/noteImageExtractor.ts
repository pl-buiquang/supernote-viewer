import { toImage } from 'supernote-typescript';
import fs from 'fs-extra';
import path from 'path';
import { BaseImageExtractor, CacheFile, PageExtractInfo } from './baseImageExtractor.js';
import { addGrayBackground } from './utils.js';

/**
 * Extracts images from a Supernote file with caching support
 */
export class NoteImageExtractor extends BaseImageExtractor {
  /**
   * Constructor for the note image extractor
   * @param inputFile Path to the input file
   * @param mediaFolder Optional folder to save extracted images
   * @param mdOutputFolder Optional folder to save a markdown file
   * @param cacheFilePath Optional path to the cache file
   */
  constructor(
    inputFile: string,
    mediaFolder?: string,
    mdOutputFolder?: string,
    cacheFilePath?: string,
    useCache?: boolean,
  ) {
    super(inputFile, mediaFolder, mdOutputFolder, cacheFilePath, 'notes', useCache);
  }

  protected getNoteFile(inputFile: string): string {
    return inputFile;
  }

  /**
   * Generates a markdown file with links to the extracted images
   */
  protected generateMarkdown(imageFilePaths: string[]): void {
    let mdContent = `# ${this.baseName}\n\n`;
    for (let i = 0; i < imageFilePaths.length; i++) {
      const pageNumber = i + 1;
      // Skip if no image file path for this page
      if (!imageFilePaths[i]) continue;

      // Get the relative path from the markdown file to the image
      const relativePath = path.relative(path.dirname(this.outputDir), imageFilePaths[i] || '');
      mdContent += `## Page ${pageNumber}\n\n`;
      mdContent += `![Page ${pageNumber}](${relativePath.replace(/\\/g, '/')})\n\n`;
    }
    const mdFileName = `${this.baseName}.md`;
    const mdFilePath = path.join(this.mdOutputFolder, mdFileName);
    fs.writeFileSync(mdFilePath, mdContent);
    console.log(`Generated markdown file: ${mdFilePath}`);
  }

  /**
   * Gets the current page information from the note file
   */
  protected async getNotePagesInfo(): Promise<PageExtractInfo[]> {
    const markedPdfPageNumbers = Object.keys(this.note.footer.PAGE);
    return this.note.pages.map((page, i) => ({
      pageNumber: markedPdfPageNumbers[i],
      index: i,
      marksCount: parseInt(page.TOTALPATH),
    }));
  }

  /**
   * Extracts and saves images for the specified pages
   */
  protected async extractAndSaveImages(pagesToExtract: PageExtractInfo[]): Promise<string[]> {
    console.log(`Extracting ${pagesToExtract.length} pages from ${this.inputFile}...`);

    // Convert page info to page numbers (1-based)
    const pageNumbers = pagesToExtract.map((page) => page.index + 1);

    // Extract images from the note
    const images = await toImage(this.note, pageNumbers);

    // Save images to the output directory
    const imageFilePaths: string[] = [];

    for (let i = 0; i < pagesToExtract.length; i++) {
      const page = pagesToExtract[i];
      const pageNumber = page.index + 1;
      const imageFileName = `${this.baseName}_page_${pageNumber}.png`;
      const imageFilePath = path.join(this.outputDir, imageFileName);

      // Save the image with background color
      const image = images[i];
      if (image) {
        const withBackGround = await addGrayBackground(image);
        await withBackGround.save(imageFilePath);
        imageFilePaths[page.index] = imageFilePath;
        console.log(`Saved image: ${imageFilePath}`);
      }
    }

    return imageFilePaths;
  }

  /**
   * Updates the cache with new page information
   */
  protected async updateCache(
    cache: CacheFile,
    currentPageInfo: PageExtractInfo[],
    imageFilePaths: string[],
  ): Promise<void> {
    // Update cache with new information
    const updatedPageInfo = currentPageInfo.map((page, i) => ({
      ...page,
      imageFilePath: imageFilePaths[i],
      lastModified: this.fileModTime,
    }));

    // Ensure the notes cache exists
    if (!cache.notes) {
      cache.notes = {};
    }

    cache.notes[this.fileKey] = {
      filePath: this.fileKey,
      lastModified: this.fileModTime,
      pages: updatedPageInfo,
    };

    // Save updated cache
    await this.saveCache(cache);
  }
}

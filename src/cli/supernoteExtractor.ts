import fs from 'fs-extra';
import path from 'path';
import { NoteImageExtractor } from './noteImageExtractor.js';
import { PdfImageExtractor } from './pdfImageExtractor.js';

/**
 * Generic image extractor that works with both .note and .pdf/.pdf.mark files
 */
export class SupernoteImageExtractor {
  private inputFile: string;
  private mediaFolder?: string;
  private mdOutputPath?: string;
  private cacheFilePath?: string;
  private fileExt: string;
  private useCache: boolean;

  /**
   * Constructor for the generic image extractor
   * @param inputFile Path to the input file (.note or .pdf)
   * @param mediaFolder Optional folder to save extracted images
   * @param mdOutputPath Optional path to save a markdown file (should be a directory for pdf and a file for note)
   * @param cacheFilePath Optional path to the cache file
   */
  constructor(
    inputFile: string,
    mediaFolder?: string,
    mdOutputPath?: string,
    cacheFilePath?: string,
    useCache: boolean = true,
  ) {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: Input file '${inputFile}' does not exist.`);
      process.exit(1);
    }

    this.inputFile = inputFile;
    this.mediaFolder = mediaFolder;
    this.mdOutputPath = mdOutputPath;
    this.cacheFilePath = cacheFilePath;
    this.useCache = useCache;
    this.fileExt = path.extname(inputFile).toLowerCase();
  }

  /**
   * Extracts images from the input file
   * @returns Array of image file paths for .note files, or a map of page numbers to image file paths for .pdf files
   */
  public async extract(): Promise<string[] | Record<number, string>> {
    try {
      // Handle .note files
      if (this.fileExt === '.note') {
        console.log(`Processing Supernote file: ${this.inputFile}`);
        const extractor = new NoteImageExtractor(
          this.inputFile,
          this.mediaFolder,
          this.mdOutputPath,
          this.cacheFilePath,
          this.useCache,
        );
        return await extractor.extract();
      }

      // Handle .pdf files
      else if (this.fileExt === '.pdf') {
        console.log(`Processing PDF file: ${this.inputFile}`);

        // Check if a corresponding .pdf.mark file exists

        const extractor = new PdfImageExtractor(
          this.inputFile,
          this.mediaFolder,
          this.mdOutputPath,
          this.cacheFilePath,
          this.useCache,
        );
        return await extractor.extract();
      }

      // Unsupported file type
      else {
        console.error(`Error: Unsupported file type '${this.fileExt}'. Only .note and .pdf files are supported.`);
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  }
}

/**
 * Extracts images from either a Supernote file (.note) or a PDF file with marks (.pdf + .pdf.mark)
 * This function is provided for backward compatibility
 * @param inputFile Path to the input file (.note or .pdf)
 * @param mediaFolder Optional folder to save extracted images
 * @param mdOutputPath Optional path to save a markdown file (only for .note files)
 * @param cacheFilePath Optional path to the cache file
 * @returns Array of image file paths for .note files, or a map of page numbers to image file paths for .pdf files
 */
export async function extractImages(
  inputFile: string,
  mediaFolder?: string,
  mdOutputPath?: string,
  cacheFilePath?: string,
  useCache: boolean = true,
): Promise<string[] | Record<number, string>> {
  const extractor = new SupernoteImageExtractor(inputFile, mediaFolder, mdOutputPath, cacheFilePath, useCache);
  return await extractor.extract();
}

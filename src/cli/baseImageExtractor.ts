import fs from 'fs-extra';
import path from 'path';
import { SupernoteX } from 'supernote-typescript';

// Define the base page extract info interface
export interface PageExtractInfo {
  pageNumber: number | string;
  index: number;
  marksCount: number;
  imageFilePath?: string;
  lastModified?: number;
}

// Define the base cache interface
export interface FileCache {
  filePath: string;
  lastModified: number;
  pages: PageExtractInfo[];
}

// Define the base cache file interface
export interface CacheFile {
  [fileType: string]: Record<string, FileCache>;
}

/**
 * Base class for image extractors
 */
export abstract class BaseImageExtractor {
  protected inputFile: string;
  protected mediaFolder?: string;
  protected mdOutputFolder?: string;
  protected cacheFilePath?: string;
  protected outputDir: string;
  protected baseName: string;
  protected cachePath: string;
  protected fileKey: string;
  protected fileModTime: number;
  protected cacheType: string;
  protected useCache: boolean;

  protected note: SupernoteX;

  /**
   * Constructor for the base image extractor
   * @param inputFile Path to the input file
   * @param mediaFolder Optional folder to save extracted images
   * @param mdOutputFolder Optional folder to save a markdown file
   * @param cacheFilePath Optional path to the cache file
   * @param cacheType Type of cache to use (e.g., 'notes', 'pdfs')
   */
  constructor(
    inputFile: string,
    mediaFolder?: string,
    mdOutputFolder?: string,
    cacheFilePath?: string,
    cacheType: string = 'files',
    useCache: boolean = true,
  ) {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: Input file '${inputFile}' does not exist.`);
      process.exit(1);
    }

    this.inputFile = inputFile;
    this.mediaFolder = mediaFolder;
    this.mdOutputFolder = mdOutputFolder;
    this.cacheFilePath = cacheFilePath;
    this.cacheType = cacheType;
    this.useCache = useCache;

    // Get file stats for modification time
    const fileStats = fs.statSync(inputFile);
    this.fileModTime = fileStats.mtimeMs;

    // Create media folder if specified, otherwise use current directory
    this.outputDir = mediaFolder ? path.resolve(mediaFolder) : process.cwd();
    fs.ensureDirSync(this.outputDir);

    // Get the base name of the input file (without extension)
    this.baseName = path.basename(inputFile, path.extname(inputFile));

    // Determine cache file path if not provided
    const defaultCachePath = path.join(this.outputDir, `.supernote-viewer-cache.json`);
    this.cachePath = cacheFilePath || defaultCachePath;

    // Set the file key for cache lookup
    this.fileKey = path.resolve(inputFile);

    // Read the note file
    const buffer = fs.readFileSync(this.getNoteFile(inputFile));
    this.note = new SupernoteX(buffer);
  }

  /**
   * Loads the cache file if it exists, or creates a new one
   */
  protected async loadCache(): Promise<CacheFile> {
    try {
      if (fs.existsSync(this.cachePath)) {
        const cacheData = await fs.readFile(this.cachePath, 'utf-8');
        return JSON.parse(cacheData);
      }
    } catch (error) {
      console.warn(`Warning: Could not load cache file. Creating a new one.`, error);
    }

    // Create a new cache with the appropriate type
    const cache: CacheFile = {};
    cache[this.cacheType] = {};
    return cache;
  }

  /**
   * Saves the cache to the cache file
   */
  protected async saveCache(cache: CacheFile): Promise<void> {
    try {
      const cacheDir = path.dirname(this.cachePath);
      await fs.ensureDir(cacheDir);
      await fs.writeFile(this.cachePath, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.error(`Error saving cache file:`, error);
    }
  }

  /**
   * Extracts images from the file
   */
  public async extract(): Promise<Record<string, string>> {
    try {
      // Initialize PDF document and note
      await this.initialize();

      // Load cache
      const cache = await this.loadCache();

      // Check if we have this PDF in cache
      const cachedPdf = cache[this.cacheType]?.[this.fileKey];

      // Check if the file or mark file has been modified
      const fileModified = !cachedPdf || cachedPdf.lastModified !== this.fileModTime;

      if (!fileModified && this.useCache) {
        console.log(`No changes detected in ${this.inputFile}. Skipping extraction.`);
        return {};
      }

      // Get page information from the PDF and mark file
      const currentPageInfo = await this.getNotePagesInfo();

      // Determine which pages need to be extracted
      let pagesToExtract: PageExtractInfo[] = [];
      const pageToImageMap: Record<number, string> = {};

      if (this.useCache && cachedPdf) {
        console.log(`Using cached information for ${this.inputFile}`);

        // Check each page individually to see if it's up to date
        for (let i = 0; i < currentPageInfo.length; i++) {
          const page = currentPageInfo[i];
          const cachedPage = cachedPdf.pages.find((existingPage) => existingPage.pageNumber === page.pageNumber);

          // A page is up to date if:
          // 1. It exists in the cache
          // 2. The marks count hasn't changed
          // 3. The image file exists
          const isPageUpToDate =
            cachedPage &&
            cachedPage.marksCount === page.marksCount &&
            cachedPage.imageFilePath &&
            fs.existsSync(cachedPage.imageFilePath);

          if (isPageUpToDate) {
            // Use cached image
            pageToImageMap[page.pageNumber] = cachedPage.imageFilePath;
            console.log(`Page ${page.pageNumber} is up to date, using cached image`);
          } else {
            // Page needs extraction
            pagesToExtract.push(page);
            console.log(
              `Page ${page.pageNumber} needs extraction (${
                !cachedPage
                  ? 'not in cache'
                  : cachedPage.marksCount !== page.marksCount
                    ? 'marks count changed'
                    : 'cached image not found'
              })`,
            );
          }
        }
      } else {
        // Extract all pages if cache is not up to date
        console.log(`No valid cache found for ${this.inputFile}. Extracting all marked pages.`);
        pagesToExtract = currentPageInfo;
      }

      // Extract images if needed
      if (pagesToExtract.length > 0) {
        const extractedImages = await this.extractAndSaveImages(pagesToExtract);

        // Merge extracted images with cached images
        Object.assign(pageToImageMap, extractedImages);
      } else {
        console.log(`All marked pages are up to date. No extraction needed.`);
      }

      // Update cache with new information
      await this.updateCache(cache, currentPageInfo, pageToImageMap);

      // Generate markdown files based on configuration
      if (this.mdOutputFolder) {
        const imageFilePaths = Object.values(pageToImageMap);
        this.generateMarkdown(imageFilePaths);
      }

      console.log('Done extracting images!');
      return pageToImageMap;
    } catch (error) {
      console.error('Error extracting images:', error);
      process.exit(1);
    }
  }

  /**
   * Gets the note file path (it will be different for pdf files)
   */
  protected abstract getNoteFile(inputFile: string): string;

  /**
   * Initializes the image extractor
   * Default implementation does nothing
   */
  protected async initialize(): Promise<void> {}

  /**
   * Gets the current page information from the input file
   * This method must be implemented by subclasses
   */
  protected abstract getNotePagesInfo(): Promise<PageExtractInfo[]>;

  /**
   * Extracts and saves images for the specified pages
   * This method must be implemented by subclasses
   */
  protected abstract extractAndSaveImages(
    pagesToExtract: PageExtractInfo[],
  ): Promise<string[] | Record<number | string, string>>;

  /**
   * Updates the cache with new page information
   * This method must be implemented by subclasses
   */
  protected abstract updateCache(
    cache: CacheFile,
    currentPageInfo: PageExtractInfo[],
    imageFilePaths: string[] | Record<number | string, string>,
  ): Promise<void>;

  /**
   * Generates a markdown file with links to the extracted images
   */
  protected abstract generateMarkdown(imageFilePaths: string[]): void;
}

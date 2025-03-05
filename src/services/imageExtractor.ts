import Worker from '@/workers/noteToImage.worker?worker';
import { SupernoteWorkerMessage, SupernoteWorkerResponse } from '@/workers/noteToImage.worker';
import { Image } from 'image-js';
import { SupernoteX } from 'supernote-typescript';
import { Logger } from '@/hooks/useAppLogger';

function dataUrlToBuffer(dataUrl: string): ArrayBuffer {
  // Remove data URL prefix (e.g., "data:image/png;base64,")
  const base64 = dataUrl.split(',')[1];
  // Convert base64 to binary string
  const binaryString = atob(base64);
  // Create buffer and view
  const bytes = new Uint8Array(binaryString.length);
  // Convert binary string to buffer
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

class WorkerPool {
  private workers: Worker[];
  private logger: Logger;

  constructor(
    logger: Logger,
    private maxWorkers: number = navigator.hardwareConcurrency - 1,
  ) {
    this.logger = logger;
    const nonEmptyMaxWorkers = Math.max(1, maxWorkers);
    this.logger.logInfo(`Creating worker pool with ${nonEmptyMaxWorkers} workers`);
    this.workers = Array(nonEmptyMaxWorkers)
      .fill(null)
      .map(() => new Worker());
  }

  private processChunk(worker: Worker, note: SupernoteX, pageNumbers: number[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      worker.onmessage = (e: MessageEvent<SupernoteWorkerResponse>) => {
        const duration = Date.now() - startTime;
        this.logger.logInfo(`Processed pages ${pageNumbers.join(',')} in ${duration}ms`);

        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(e.data.images);
        }
      };

      worker.onerror = (error) => {
        this.logger.logError('Worker error:', error);
        reject(error);
      };

      const message: SupernoteWorkerMessage = {
        type: 'convert',
        note,
        pageNumbers,
      };

      worker.postMessage(message);
    });
  }

  async processPages(note: SupernoteX, allPageNumbers: number[]): Promise<string[]> {
    //console.time('Total processing time');

    // Split pages into chunks based on number of workers
    const chunkSize = Math.ceil(allPageNumbers.length / this.workers.length);
    const chunks: number[][] = [];

    for (let i = 0; i < allPageNumbers.length; i += chunkSize) {
      chunks.push(allPageNumbers.slice(i, i + chunkSize));
    }

    //this.logInfo(`Processing ${allPageNumbers.length} pages in ${chunks.length} chunks`);

    // Process chunks in parallel using available workers
    const results = await Promise.all(
      chunks.map((chunk, index) => this.processChunk(this.workers[index % this.workers.length], note, chunk)),
    );

    //console.timeEnd('Total processing time');
    return results.flat();
  }

  terminate() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
  }
}

class ImageConverter {
  private workerPool: WorkerPool;
  private logger: Logger;

  constructor(logger: Logger, maxWorkers = navigator.hardwareConcurrency) {
    // Default to 4 workers
    this.logger = logger;
    this.workerPool = new WorkerPool(this.logger, maxWorkers);
  }

  async convertToImages(note: SupernoteX, pageNumbers?: number[]): Promise<string[]> {
    const pages = pageNumbers ?? Array.from({ length: note.pages.length }, (_, i) => i + 1);
    const results = await this.workerPool.processPages(note, pages);
    return results;
  }

  terminate() {
    this.workerPool.terminate();
  }
}

export const extractImages = async (note: SupernoteX, pages: number[], logger: Logger): Promise<Image[]> => {
  let images: string[] = [];

  const converter = new ImageConverter(logger);
  try {
    images = await converter.convertToImages(note, pages);
  } finally {
    // Clean up the worker when done
    converter.terminate();
  }

  return Promise.all(
    images.map(async (dataUrl) => {
      const buffer = dataUrlToBuffer(dataUrl);
      return await Image.load(buffer);
    }),
  );
};

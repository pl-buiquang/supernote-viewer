#!/usr/bin/env node

import { Command } from 'commander';
import { extractImages } from './supernoteExtractor.js';

const program = new Command();

program.name('supernote-cli').description('CLI tool for Supernote files').version('0.1.0');

program
  .option('-x, --extract <input_file>', 'Extract images from a Supernote file or a PDF file with marks')
  .option('--generate-md <md_output_path>', 'Generate a markdown file with links to the extracted images')
  .option('--media-folder <folder_path>', 'Folder to save extracted images')
  .option(
    '--cache-file <cache_file_path>',
    'Path to the cache file (defaults to .supernote-viewer-cache.json in the same directory as the media folder)',
  )
  .option('--force', 'Force extraction even if cache exists')
  .helpOption('-h, --help', 'Display help for command');

async function main() {
  program.parse();
  const options = program.opts();

  if (options.extract) {
    await extractImages(options.extract, options.mediaFolder, options.generateMd, options.cacheFile, !options.force);
  } else {
    program.help();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

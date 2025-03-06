#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { SupernoteX, toImage } from 'supernote-typescript';

const program = new Command();

program.name('supernote-cli').description('CLI tool for Supernote files').version('0.1.0');

program
  .option('-x, --extract <input_file>', 'Extract images from a Supernote file')
  .option('--generate-md <md_output_path>', 'Generate a markdown file with links to the extracted images')
  .option('--media-folder <folder_path>', 'Folder to save extracted images')
  .helpOption('-h, --help', 'Display help for command');

async function extractImages(inputFile: string, mediaFolder?: string, mdOutputPath?: string) {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: Input file '${inputFile}' does not exist.`);
      process.exit(1);
    }

    // Read the note file
    const buffer = fs.readFileSync(inputFile);
    const note = new SupernoteX(buffer);

    // Create media folder if specified, otherwise use current directory
    const outputDir = mediaFolder ? path.resolve(mediaFolder) : process.cwd();
    fs.ensureDirSync(outputDir);

    // Get the base name of the input file (without extension)
    const baseName = path.basename(inputFile, path.extname(inputFile));

    // Extract images from the note
    console.log(`Extracting images from ${inputFile}...`);
    const images = await toImage(note);

    // Save images to the output directory
    const imageFilePaths: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const pageNumber = i + 1;
      const imageFileName = `${baseName}_page_${pageNumber}.png`;
      const imageFilePath = path.join(outputDir, imageFileName);

      // Save the image
      const image = images[i];
      if (image) {
        await image.save(imageFilePath);
        imageFilePaths.push(imageFilePath);
        console.log(`Saved image: ${imageFilePath}`);
      }
    }

    // Generate markdown file if specified
    if (mdOutputPath) {
      const mdContent = generateMarkdown(baseName, imageFilePaths, outputDir);
      fs.writeFileSync(mdOutputPath, mdContent);
      console.log(`Generated markdown file: ${mdOutputPath}`);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function generateMarkdown(baseName: string, imageFilePaths: string[], outputDir: string): string {
  let mdContent = `# ${baseName}\n\n`;
  for (let i = 0; i < imageFilePaths.length; i++) {
    const pageNumber = i + 1;
    // Get the relative path from the markdown file to the image
    const relativePath = path.relative(path.dirname(outputDir), imageFilePaths[i] || '');
    mdContent += `## Page ${pageNumber}\n\n`;
    mdContent += `![Page ${pageNumber}](${relativePath.replace(/\\/g, '/')})\n\n`;
  }
  return mdContent;
}

async function main() {
  program.parse();
  const options = program.opts();

  if (options.extract) {
    await extractImages(options.extract, options.mediaFolder, options.generateMd);
  } else {
    program.help();
  }
}

main().catch(console.error);

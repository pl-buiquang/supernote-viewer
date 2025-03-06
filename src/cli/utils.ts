import { Image } from 'image-js';

export async function addGrayBackground(originalImage, grayValue = 245) {
  return originalImage;
  // Create a new image with gray background
  const backgroundImage = new Image({
    width: originalImage.width,
    height: originalImage.height,
    bitDepth: originalImage.bitDepth,
    //colorModel: originalImage.colorModel, // Preserve the original color space
    //alpha: originalImage.alpha, // Preserve alpha channel if present
  });

  // Fill with gray - we need to set each pixel manually
  for (let x = 0; x < backgroundImage.width; x++) {
    for (let y = 0; y < backgroundImage.height; y++) {
      // Set pixel color based on the number of channels
      if (backgroundImage.channels === 1) {
        // Grayscale
        backgroundImage.setPixelXY(x, y, [grayValue]);
      } else if (backgroundImage.channels === 3) {
        // RGB
        backgroundImage.setPixelXY(x, y, [241, grayValue, 249]);
      } else if (backgroundImage.channels === 4) {
        // RGBA
        backgroundImage.setPixelXY(x, y, [241, grayValue, 249, 255]);
      }
    }
  }

  // Composite the original image onto the background
  // For images with alpha channel, we'll blend pixel by pixel
  for (let x = 0; x < originalImage.width; x++) {
    for (let y = 0; y < originalImage.height; y++) {
      const pixelOriginal = originalImage.getPixelXY(x, y);
      backgroundImage.setPixelXY(x, y, pixelOriginal);
      // if (originalImage.alpha) {
      //   // If there's an alpha channel, blend based on alpha
      //   const alpha = pixelOriginal[3] / 255;
      //   if (alpha > 0) {
      //     const pixelBackground = backgroundImage.getPixelXY(x, y);
      //     const result = pixelBackground.slice(); // Create a copy

      //     // Blend RGB channels
      //     for (let c = 0; c < 3; c++) {
      //       result[c] = Math.round(pixelOriginal[c] * alpha + pixelBackground[c] * (1 - alpha));
      //     }

      //     // Set alpha to fully opaque
      //     if (result.length > 3) {
      //       result[3] = 255;
      //     }

      //     backgroundImage.setPixelXY(x, y, result);
      //   }
      // } else {
      //   // If no alpha, directly copy the pixel
      //   backgroundImage.setPixelXY(x, y, pixelOriginal);
      // }
    }
  }

  return backgroundImage;
}

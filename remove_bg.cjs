const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function removeBackground(inputPath, outputPath) {
    try {
        const image = await loadImage(inputPath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw the original image
        ctx.drawImage(image, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Threshold for considering a pixel "white enough" to be background
        // 255 is pure white. Using 240 catches slightly off-white pixels
        const threshold = 240;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // If the pixel is very close to white, make it transparent
            if (r > threshold && g > threshold && b > threshold) {
                data[i + 3] = 0; // Set alpha to 0 (transparent)
            } else if (r > 200 && g > 200 && b > 200) {
                // Soft edge blending for bright but not quite white pixels
                const maxColor = Math.max(r, g, b);
                const ratio = (255 - maxColor) / (255 - 200);
                data[i + 3] = Math.floor(255 * ratio); // partial transparency
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Output image
        const out = fs.createWriteStream(outputPath);
        const stream = canvas.createPNGStream();

        stream.pipe(out);
        out.on('finish', () => console.log('Successfully created transparent logo.'));
    } catch (err) {
        console.error('Error processing image:', err);
    }
}

const inPath = 'logo.jpg';
const outPath = 'logo-transparent.png';

console.log('Processing:', inPath);
removeBackground(inPath, outPath);

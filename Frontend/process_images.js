import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const images = [
    'public/assets/image1.png',
    'public/assets/image2.png',
    'public/assets/image3.png',
    'public/assets/image4.png'
];

async function processImages() {
    for (const imgPath of images) {
        const fullPath = path.resolve(imgPath);
        if (!fs.existsSync(fullPath)) {
            console.error(`File not found: ${fullPath}`);
            continue;
        }

        try {
            const image = sharp(fullPath);
            const metadata = await image.metadata();

            // Extract a 1x1 pixel from the top-left corner
            const { data } = await image.clone().extract({ left: 10, top: 10, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });

            const r = data[0];
            const g = data[1];
            const b = data[2];

            console.log(`Processing ${imgPath} with bg color rgb(${r},${g},${b}) and dimensions ${metadata.width}x${metadata.height}`);

            // We want to cover only the left part of the image where text usually is, without cutting the person.
            // Let's use 35% of the width and add a gradient fade to make it seamless.
            const solidWidth = Math.floor(metadata.width * 0.35);
            const gradientWidth = Math.floor(metadata.width * 0.15);
            const totalOverlayWidth = solidWidth + gradientWidth;

            const svgOverlay = Buffer.from(`
                <svg width="${metadata.width}" height="${metadata.height}">
                    <defs>
                        <linearGradient id="fade" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="${(solidWidth / totalOverlayWidth) * 100}%" stop-color="rgb(${r},${g},${b})" stop-opacity="1" />
                            <stop offset="100%" stop-color="rgb(${r},${g},${b})" stop-opacity="0" />
                        </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="${totalOverlayWidth}" height="${metadata.height}" fill="url(#fade)" />
                </svg>
            `);

            // Apply overlay and save
            const outPath = fullPath.replace('.png', '_clean.png');
            await image.composite([{ input: svgOverlay, top: 0, left: 0 }]).toFile(outPath);
            console.log(`Saved ${outPath}`);

        } catch (err) {
            console.error(`Error processing ${imgPath}:`, err);
        }
    }
}

processImages();

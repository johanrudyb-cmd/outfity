
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const agentsDir = path.join(__dirname, 'public', 'images', 'agents');
const files = fs.readdirSync(agentsDir);

async function optimize() {
    for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg')) {
            const inputPath = path.join(agentsDir, file);
            const stats = fs.statSync(inputPath);

            // Only optimize if > 200KB
            if (stats.size > 200 * 1024) {
                console.log(`Optimizing ${file} (${(stats.size / 1024).toFixed(1)} KB)...`);
                const outputPath = inputPath.replace('.png', '_tmp.png').replace('.jpg', '_tmp.jpg');

                await sharp(inputPath)
                    .resize(800) // Standardize width
                    .png({ quality: 80, compressionLevel: 9 })
                    .toFile(outputPath);

                const newStats = fs.statSync(outputPath);
                console.log(`Finished ${file}: ${(newStats.size / 1024).toFixed(1)} KB`);

                fs.renameSync(outputPath, inputPath);
            }
        }
    }
}

optimize().catch(console.error);

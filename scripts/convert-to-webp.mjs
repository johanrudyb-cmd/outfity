import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import fsSync from 'fs';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const APP_DIR = path.join(process.cwd(), 'app');
const COMPONENTS_DIR = path.join(process.cwd(), 'components');
const CONFIG_FILE = path.join(process.cwd(), 'next.config.ts');
const PAGE_FILES = [path.join(process.cwd(), 'app', 'layout.tsx')]; // just examples, we will search all files

// Recursive function to get all files
async function walk(dir) {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const file of list) {
        if (file.isDirectory()) {
            results = results.concat(await walk(path.join(dir, file.name)));
        } else {
            results.push(path.join(dir, file.name));
        }
    }
    return results;
}

const fileMap = new Map();

async function convertImages() {
    const files = await walk(PUBLIC_DIR);

    let processed = 0;

    for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            const ext = path.extname(file);
            const newFile = file.slice(0, -ext.length) + '.webp';

            const stats = await fs.stat(file);
            const oldSize = (stats.size / 1024).toFixed(1);

            try {
                await sharp(file)
                    .webp({ quality: 80 })
                    .toFile(newFile);

                const newStats = await fs.stat(newFile);
                const newSize = (newStats.size / 1024).toFixed(1);

                console.log(`Converted: ${path.basename(file)} (${oldSize}KB) -> ${path.basename(newFile)} (${newSize}KB)`);

                // Track for string replacement
                const oldName = path.basename(file);
                const newName = path.basename(newFile);
                fileMap.set(oldName, newName);

                // remove old file
                await fs.unlink(file);
                processed++;
            } catch (err) {
                console.error(`Error converting ${file}:`, err.message);
            }
        }
    }

    console.log(`\nSuccessfully converted ${processed} images.`);
    return fileMap;
}

async function updateCodeReferences(map) {
    const codeDirs = [APP_DIR, COMPONENTS_DIR];
    let codeFiles = [];

    for (const dir of codeDirs) {
        if (fsSync.existsSync(dir)) {
            codeFiles = codeFiles.concat(await walk(dir));
        }
    }

    // Add layout/config if needed
    if (fsSync.existsSync(CONFIG_FILE)) codeFiles.push(CONFIG_FILE);

    let updatedFiles = 0;

    for (const file of codeFiles) {
        if (!file.endsWith('.tsx') && !file.endsWith('.ts') && !file.endsWith('.js') && !file.endsWith('.json') && !file.endsWith('.css')) continue;

        let content = await fs.readFile(file, 'utf8');
        let changed = false;

        for (const [oldName, newName] of map.entries()) {
            // Only replace if it looks like a local path string, e.g. "/images/agents/ada.png"
            // or "/icon.png"
            // We'll replace the exact filename string
            const regex = new RegExp(`(?<=/)${escapeRegExp(oldName)}|(?<=['"\`])${escapeRegExp(oldName)}`, 'g');
            if (regex.test(content)) {
                content = content.replace(regex, newName);
                changed = true;
            }
        }

        if (changed) {
            await fs.writeFile(file, content, 'utf8');
            console.log(`Updated references in: ${path.relative(process.cwd(), file)}`);
            updatedFiles++;
        }
    }

    console.log(`\nUpdated ${updatedFiles} code files.`);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function run() {
    console.log('Starting WebP conversion...');
    const map = await convertImages();
    console.log('Updating codebase references...');
    await updateCodeReferences(map);
    console.log('All done!');
}

run();

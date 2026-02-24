const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const termsToReplace = [
    { regex: /par\s+BIANGORY/gi, replacement: "par OUTFITY" },
    { regex: /Propulsé\s+par\s+BIANGORY/gi, replacement: "Propulsé par OUTFITY" },
    { regex: /\|\s*BIANGORY/gi, replacement: "| OUTFITY" },
    { regex: /intelligence\s+artificielle\s+mode/gi, replacement: "data mode" },
    { regex: /l'IA\s+BIANGORY/gi, replacement: "OUTFITY" },
    { regex: /OUTFITY\s+-\s+BIANGORY/gi, replacement: "OUTFITY" },
    { regex: /BIANGORY\s+\/\s+OUTFITY/gi, replacement: "OUTFITY" },
    { regex: /L'équipe IA OUTFITY/gi, replacement: "OUTFITY" },
    { regex: /l'équipe IA/gi, replacement: "OUTFITY" },
    { regex: /l'équipe d'experts IA/gi, replacement: "OUTFITY" },
];

walkDir('./app', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Do not touch Legal pages where BIANGORY is correctly mentioned as Auto-entreprise publisher
        // except for titles/descriptions if needed. But it's safer to skip full replacement on Mentions/Privacy/Terms/Sales.
        const isLegalPage = filePath.includes('legal\\') || filePath.includes('legal/');

        if (!isLegalPage) {
            // Replace BIANGORY inside strings
            content = content.replace(/BIANGORY/g, (match, offset, string) => {
                // skip if it's in a legal context, though we excluded legal pages
                return "OUTFITY";
            });

            content = content.replace(/Intelligence Artificielle/gi, "Data & Sourcing");
            content = content.replace(/intelligence artificielle/gi, "la data et le sourcing");
            content = content.replace(/créer sa marque de vêtement avec l'ia/gi, "créer sa marque de vêtement professionnellement");
        } else {
            // Just fix the description/title without changing the legal entity in the body
            content = content.replace(/plateforme OUTFITY par BIANGORY/gi, "plateforme OUTFITY");
            content = content.replace(/OUTFITY par BIANGORY/gi, "OUTFITY");
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${filePath}`);
        }
    }
});

console.log('Update completed.');

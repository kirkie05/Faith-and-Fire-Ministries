const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    // In index.css, just replace most, but we can leave --color-accent-500 as f59e0b
    if (filePath.endsWith('index.css')) {
        content = content.replace(/#f59e0b/g, '#38bdf8');
        // Let's restore the first accent
        content = content.replace(/--color-accent-500: #38bdf8;/g, '--color-accent-500: #f59e0b;');
    } else {
        // In TSX files, we want to replace all text-[#f59e0b], bg-[#f59e0b], border-[#f59e0b]
        // BUT we want to preserve star ratings ('★★★★★'.split(''))
        // and Flame icon colors (<Flame className="... text-[#f59e0b]" />)
        
        // Actually it's easier to replace everything then fix back the exceptions
        content = content.replace(/#f59e0b/g, '#38bdf8');
        
        // Fix exceptions
        content = content.replace(/text-\[#38bdf8\]\"\>\{s\}\<\/span\>/g, 'text-[#f59e0b]">{s}</span>'); // Stars
        content = content.replace(/Flame className=\"([^\"]*)text-\[#38bdf8\]/g, 'Flame className=\"$1text-[#f59e0b]'); // Flame
        content = content.replace(/glow: \"#38bdf8\"/g, 'glow: "#f59e0b"'); // Fire canvas glow
        content = content.replace(/rgba\(245, 158, 11, /g, 'rgba(245, 158, 11, '); // Fire canvas base - already kept
        
        // Let's also restore the 'experience' badge? Or maybe just keep it light blue.
    }

    fs.writeFileSync(filePath, content, 'utf8');
};

const filesToProcess = [
    'src/index.css',
    'src/components/PublicScreens.tsx',
    'src/components/ChurchPages.tsx',
    'src/components/Navigation.tsx',
    'src/data.ts'
];

filesToProcess.forEach(f => {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) {
        replaceInFile(p);
        console.log(`Processed ${f}`);
    }
});

/**
 * Automated any → proper-type replacement script for services.
 * Handles the most common mechanical patterns:
 *  1. catch (error: any) → catch (error: unknown)
 *  2. catch (err: any) → catch (err: unknown)
 *  3. (e: any) in error params → (e: unknown) 
 *  4. Record<string, any> → Record<string, unknown>
 *  5. : any[] → : unknown[]
 *  6. : any) in function params where safe → : unknown)
 *  
 * Does NOT touch: `as any` (needs manual review), complex type signatures
 */
const fs = require('fs');
const path = require('path');

const BASE = '/Users/jason.leee/imhungryapp/ImHungryApp/';
const SERVICES_DIR = path.join(BASE, 'src/services');

let totalFixed = 0;
let filesFixed = 0;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    let fixes = 0;

    // 1. catch (error: any) → catch (error: unknown)
    const catchPattern = /catch\s*\(\s*(error|err|e)\s*:\s*any\s*\)/g;
    content = content.replace(catchPattern, (match, varName) => {
        fixes++;
        return `catch (${varName}: unknown)`;
    });

    // 2. Record<string, any> → Record<string, unknown>
    content = content.replace(/Record<string,\s*any>/g, () => {
        fixes++;
        return 'Record<string, unknown>';
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        const relPath = filePath.replace(BASE, '');
        console.log(`Fixed ${fixes} in ${relPath}`);
        totalFixed += fixes;
        filesFixed++;
    }
}

function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'test-utils' || entry.name === 'node_modules') continue;
            walkDir(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

walkDir(SERVICES_DIR);

console.log(`\nDone. ${totalFixed} replacements across ${filesFixed} files.`);

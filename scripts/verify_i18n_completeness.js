/**
 * @file verify_i18n_completeness.js
 * @description Scans the codebase for t() calls and verifies they exist in models_util.js translations.
 *              Also compares EN and ES maps for parity.
 */

const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '../docs/js');
const MODELS_LANG_PATH = path.join(JS_DIR, 'models_lang.js');
const MODELS_UTIL_PATH = path.join(JS_DIR, 'models_util.js');

// 1. Extract translations from models_lang.js
function getTranslations() {
    const code = fs.readFileSync(MODELS_LANG_PATH, 'utf8');
    const enMatch = code.match(/en: \{([\s\S]*?)\},/);
    const esMatch = code.match(/es: \{([\s\S]*?)\}/);

    const extractKeys = (content) => {
        const keys = new Set();
        // Match keys like: consent_title: "...", or "Environmental Stress": "..."
        const keyRegex = /^\s*(?:"([^"]+)"|'([^']+)'|([a-zA-Z0-9_]+)):\s*/gm;
        let m;
        while ((m = keyRegex.exec(content)) !== null) {
            keys.add(m[1] || m[2] || m[3]);
        }
        return keys;
    };

    return {
        en: extractKeys(enMatch ? enMatch[1] : ''),
        es: extractKeys(esMatch ? esMatch[1] : '')
    };
}

// 2. Scan all JS files for t() calls
function scanForKeys() {
    const keysFound = new Map(); // key -> file[]
    const files = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));

    files.forEach(file => {
        const content = fs.readFileSync(path.join(JS_DIR, file), 'utf8');
        const patterns = [
            /\.t\(['"]([^'"]+)['"]\)/g,
            /\bt\(['"]([^'"]+)['"]\)/g
        ];

        patterns.forEach(regex => {
            let m;
            while ((m = regex.exec(content)) !== null) {
                const key = m[1];
                if (!keysFound.has(key)) keysFound.set(key, []);
                keysFound.get(key).push(file);
            }
        });

        // Also look for labels in arrays that might be passed to t()
        // e.g. label: 'Base Excision'
        const labelRegex = /label:\s*['"]([^'"]+)['"]/g;
        let m2;
        while ((m2 = labelRegex.exec(content)) !== null) {
            const key = m2[1];
            // Only add if it's likely a UI label (has spaces or mixed case)
            if (key.includes(' ') || (key.length > 3 && key !== key.toLowerCase())) {
                if (!keysFound.has(key)) keysFound.set(key, []);
                keysFound.get(key).push(file + ' (potential label)');
            }
        }
    });

    return keysFound;
}

function main() {
    console.log("Starting Rigorous i18n Completeness Verification...");
    const translations = getTranslations();
    const keysInCode = scanForKeys();

    console.log(`\nFound ${keysInCode.size} unique potential i18n keys in code.`);
    console.log(`Found ${translations.en.size} keys in English translation map.`);
    console.log(`Found ${translations.es.size} keys in Spanish translation map.\n`);

    const missingInMaps = [];
    keysInCode.forEach((files, key) => {
        if (!translations.en.has(key) || !translations.es.has(key)) {
            let status = '';
            if (!translations.en.has(key)) status += '[Missing EN map] ';
            if (!translations.es.has(key)) status += '[Missing ES map] ';
            missingInMaps.push(`${status} Key: "${key}" (Found in: ${[...new Set(files)].join(', ')})`);
        }
    });

    const mapMismatch = [];
    translations.en.forEach(key => {
        if (!translations.es.has(key)) {
            mapMismatch.push(`[Map Mismatch] Key "${key}" exists in EN but missing in ES.`);
        }
    });
    translations.es.forEach(key => {
        if (!translations.en.has(key)) {
            mapMismatch.push(`[Map Mismatch] Key "${key}" exists in ES but missing in EN.`);
        }
    });

    if (missingInMaps.length > 0) {
        console.log("❌ KEYS FOUND IN CODE BUT MISSING IN MAPS:");
        missingInMaps.sort().forEach(line => console.log(line));
    }

    if (mapMismatch.length > 0) {
        console.log("\n❌ EN AND ES MAPS ARE OUT OF SYNC:");
        mapMismatch.sort().forEach(line => console.log(line));
    }

    if (missingInMaps.length === 0 && mapMismatch.length === 0) {
        console.log("✅ All keys found in code are present in translation maps, and maps are in sync.");
    }

    console.log("\n--- Summary ---");
    console.log(`Keys missing in one or more maps: ${missingInMaps.length}`);
    console.log(`Map mismatches (EN vs ES): ${mapMismatch.length}`);

    if (missingInMaps.length > 0 || mapMismatch.length > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

main();

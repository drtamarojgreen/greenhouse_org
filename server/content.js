'use strict';

const fs = require('fs/promises');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const ENDPOINTS_DIR = path.join(DOCS_DIR, 'endpoints');

async function readEndpoint(relativePath, fallback = null) {
    const fullPath = path.resolve(ENDPOINTS_DIR, relativePath);
    if (!fullPath.startsWith(ENDPOINTS_DIR + path.sep)) {
        throw new Error(`Invalid endpoint path: ${relativePath}`);
    }
    try {
        const text = await fs.readFile(fullPath, 'utf8');
        return JSON.parse(text);
    } catch (error) {
        if (fallback !== null && (error.code === 'ENOENT' || error instanceof SyntaxError)) {
            return fallback;
        }
        throw error;
    }
}

module.exports = { DOCS_DIR, ENDPOINTS_DIR, readEndpoint };

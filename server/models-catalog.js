'use strict';

const fs = require('fs/promises');
const path = require('path');
const { ENDPOINTS_DIR } = require('./content');

const XML_PATH = path.join(ENDPOINTS_DIR, 'model_descriptions.xml');

const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeXml(text) {
    return text
        .replace(/&(amp|lt|gt|quot|apos);/g, (match, name) => XML_ENTITIES[name])
        .replace(/&#(\d+);/g, (match, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (match, code) => String.fromCodePoint(parseInt(code, 16)))
        .trim();
}

function paragraphsOf(block) {
    const paragraphs = [];
    const pattern = /<paragraph>([\s\S]*?)<\/paragraph>/g;
    let match;
    while ((match = pattern.exec(block)) !== null) {
        paragraphs.push(decodeXml(match[1]));
    }
    return paragraphs;
}

function parseModelDescriptions(xml) {
    const introMatch = xml.match(/<intro>([\s\S]*?)<\/intro>/);
    const models = {};
    const modelPattern = /<model\s+id="([^"]+)"\s*>([\s\S]*?)<\/model>/g;
    let match;
    while ((match = modelPattern.exec(xml)) !== null) {
        const [, id, body] = match;
        const title = body.match(/<title>([\s\S]*?)<\/title>/);
        const url = body.match(/<url>([\s\S]*?)<\/url>/);
        models[id] = {
            id,
            title: title ? decodeXml(title[1]) : id,
            url: url ? decodeXml(url[1]) : `/${id}`,
            paragraphs: paragraphsOf(body)
        };
    }
    return { intro: introMatch ? paragraphsOf(introMatch[1]) : [], models };
}

async function loadModelCatalog() {
    try {
        return parseModelDescriptions(await fs.readFile(XML_PATH, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return { intro: [], models: {} };
        throw error;
    }
}

module.exports = { loadModelCatalog, parseModelDescriptions };

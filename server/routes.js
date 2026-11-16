'use strict';

const express = require('express');
const { readEndpoint } = require('./content');
const { loadModelCatalog } = require('./models-catalog');
const { processVideoFeed } = require('./videos');
const backendData = require('./data/backend');
const { SIMULATIONS } = require('./site');
const { layout } = require('./views/layout');
const contentPages = require('./views/content-pages');
const appPages = require('./views/app-pages');

async function loadVideos() {
    const data = await readEndpoint('videos/main.json', { items: [] });
    if (Array.isArray(data.items) && data.items.length > 0) {
        return data.items.map(item => ({
            ...item,
            url: item.url || item.embedUrl,
            embeddable: Boolean(item.embedUrl)
        }));
    }
    return processVideoFeed(backendData.videoFeed);
}

async function loadModelsData() {
    const [brain, synapse, environment] = await Promise.all([
        readEndpoint('models_brain.json', {}),
        readEndpoint('models_synapses.json', {}),
        readEndpoint('models_environment.json', {})
    ]);
    return { brain, synapse, environment };
}

const PAGE_HANDLERS = {
    '/': async () => contentPages.homePage({
        main: await readEndpoint('main.json', {}),
        catalog: await loadModelCatalog()
    }),
    '/books': async () => contentPages.booksPage({ books: await readEndpoint('books.json', {}) }),
    '/news': async () => contentPages.newsPage({ news: await readEndpoint('news.json', {}) }),
    '/videos': async () => contentPages.videosPage({ videos: await loadVideos() }),
    '/inspiration': async () => contentPages.inspirationPage({ inspiration: await readEndpoint('inspiration.json', {}) }),
    '/quizzes': async () => appPages.quizzesPage({ quizzes: await readEndpoint('quizzes.json', { quizzes: [] }) }),
    '/schedule': async () => appPages.schedulePage(),
    '/models': async () => appPages.modelsPage({
        catalog: await loadModelCatalog(),
        modelsData: await loadModelsData()
    }),
    '/tech': async () => appPages.techPage({
        techData: {
            source: 'Greenhouse standalone server',
            timestamp: new Date().toISOString(),
            configMessage: 'This data was populated by the Node.js page renderer.'
        }
    })
};

for (const simulation of SIMULATIONS) {
    PAGE_HANDLERS[simulation.path] = async () => {
        const catalog = await loadModelCatalog();
        return appPages.simulationPage({ simulation, model: catalog.models[simulation.key] });
    };
}

function sendPage(res, page, status = 200) {
    res.status(status).type('html').send(layout(page));
}

function createPageRouter() {
    const router = express.Router();

    for (const [path, handler] of Object.entries(PAGE_HANDLERS)) {
        router.get(path, async (req, res) => {
            sendPage(res, await handler(req));
        });
    }

    return router;
}

function notFoundHandler(req, res) {
    sendPage(res, appPages.notFoundPage(), 404);
}

function errorHandler(err, req, res, next) {
    console.error('Request failed:', req.method, req.originalUrl, err);
    if (res.headersSent) return next(err);
    if (req.originalUrl.startsWith('/_functions')) {
        return res.status(500).json({ message: 'Internal server error.' });
    }
    sendPage(res, appPages.errorPage(), 500);
}

module.exports = { createPageRouter, notFoundHandler, errorHandler, PAGE_PATHS: Object.keys(PAGE_HANDLERS) };

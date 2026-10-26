'use strict';

const path = require('path');
const express = require('express');
const { DOCS_DIR } = require('./server/content');
const { createFunctionsRouter } = require('./server/functions');
const { createPageRouter, notFoundHandler, errorHandler } = require('./server/routes');

const DEFAULT_PORT = 8080;
const STATIC_DIRECTORIES = ['js', 'css', 'endpoints', 'images', 'assets'];

function createApp(options = {}) {
    const app = express();
    app.disable('x-powered-by');

    app.use((req, res, next) => {
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Frame-Options': 'SAMEORIGIN'
        });
        next();
    });

    app.use('/site', express.static(path.join(__dirname, 'public'), { fallthrough: false }));
    for (const dir of STATIC_DIRECTORIES) {
        app.use(`/${dir}`, express.static(path.join(DOCS_DIR, dir), { fallthrough: false, dotfiles: 'ignore' }));
    }

    app.use('/_functions', createFunctionsRouter(options));
    app.use(createPageRouter());

    app.use(notFoundHandler);
    app.use((err, req, res, next) => {
        if (err && err.status === 404) return notFoundHandler(req, res);
        errorHandler(err, req, res, next);
    });

    return app;
}

function start(port = Number(process.env.PORT) || DEFAULT_PORT) {
    const app = createApp();
    const server = app.listen(port, () => {
        console.log(`Greenhouse site listening on http://localhost:${port}`);
    });
    const shutdown = () => server.close(() => process.exit(0));
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    return server;
}

if (require.main === module) {
    start();
}

module.exports = { createApp, start };

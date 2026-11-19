'use strict';

const path = require('path');
const express = require('express');
const { PUBLIC_DIR } = require('./server/content');
const { createFunctionsRouter } = require('./server/functions');
const { createPageRouter, notFoundHandler, errorHandler } = require('./server/routes');

const DEFAULT_PORT = 8080;
const STATIC_DIRECTORIES = ['site', 'js', 'css', 'endpoints', 'images', 'assets'];
const STATIC_PREFIXES = STATIC_DIRECTORIES.map(dir => `/${dir}/`);

function isStaticAssetRequest(req) {
    const urlPath = req.path || req.originalUrl || '';
    return STATIC_PREFIXES.some(prefix => urlPath.startsWith(prefix) || urlPath === prefix.slice(0, -1));
}

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

    for (const dir of STATIC_DIRECTORIES) {
        app.use(`/${dir}`, express.static(path.join(PUBLIC_DIR, dir), { fallthrough: false, dotfiles: 'ignore' }));
    }

    app.use('/_functions', createFunctionsRouter(options));
    app.use(createPageRouter());

    app.use((req, res) => {
        if (isStaticAssetRequest(req)) {
            return res.status(404).type('text/plain').send('Not Found');
        }
        return notFoundHandler(req, res);
    });

    app.use((err, req, res, next) => {
        if (err && err.status === 404) {
            if (isStaticAssetRequest(req)) {
                return res.status(404).type('text/plain').send('Not Found');
            }
            return notFoundHandler(req, res);
        }
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

// --- Module-level app instance (what Vercel invokes) ---------------------
const app = createApp();

module.exports = app;                 // Vercel calls this as the handler
module.exports.createApp = createApp; // keep factory available for tests
module.exports.start = start;         // keep CLI start available

// --- Local CLI entry point (node app.js) --------------------------------
if (require.main === module) {
    start();
}

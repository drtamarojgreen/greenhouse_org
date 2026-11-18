/**
 * @file greenhouse.js
 * @description ES module entry point for the standalone Greenhouse web application.
 * Imports shared utilities and dynamically imports route-specific modules without
 * relying on global `window` loaders or injecting `<script>` tags into HTML.
 */

import { GreenhouseUtils } from './GreenhouseUtils.js';

GreenhouseUtils.appState.baseUrl = '/';

const ROUTE_MODULES = {
    '/models': () => import('./models.js'),
    '/schedule': () => import('./scheduler.js'),
    '/books': () => import('./books.js'),
    '/news': () => import('./news.js'),
    '/quizzes': () => import('./quizzes.js'),
    '/tech': () => import('./tech.js'),
    '/genetic': () => import('./genetic.js'),
    '/neuro': () => import('./neuro.js'),
    '/pathway': () => import('./pathway.js'),
    '/synapse': () => import('./synapse.js'),
    '/dopamine': () => import('./dopamine.js'),
    '/serotonin': () => import('./serotonin.js'),
    '/dna': () => import('./dna_repair.js'),
    '/rna': () => import('./rna_repair.js'),
    '/emotion': () => import('./emotion.js'),
    '/cognition': () => import('./cognition.js'),
    '/inflammation': () => import('./inflammation.js'),
    '/stress': () => import('./stress.js'),
};

function normalizePathname(pathname) {
    if (!pathname || pathname === '/') return '/';
    return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

async function initialize() {
    import('./effects.js').catch(error => {
        console.warn('[Greenhouse] Optional effects module failed to import:', error);
    });

    if (GreenhouseUtils.isMobileUser()) {
        import('./GreenhouseMobile.js').catch(error => {
            console.warn('[Greenhouse] Optional mobile module failed to import:', error);
        });
    }

    const route = normalizePathname(window.location.pathname);
    const importRouteModule = ROUTE_MODULES[route];
    if (importRouteModule) {
        try {
            await importRouteModule();
        } catch (error) {
            console.error(`[Greenhouse] Failed to import module for ${route}:`, error);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

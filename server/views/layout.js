'use strict';

const { html, raw, serializeForScript } = require('../html');
const { SITE_NAME, PRIMARY_NAV, SIMULATIONS, clientConfig } = require('../site');

function navLink(item, activeKey) {
    const current = item.key === activeKey ? raw(' aria-current="page"') : '';
    return html`<li><a href="${item.path}"${current}>${item.label}</a></li>`;
}

function navigation(activeKey) {
    if (activeKey === 'home') {
        return html`
    <nav class="site-nav historic-nav" aria-label="Main navigation">
        <ul class="nav-list">
            <li><a href="/" aria-current="page">Home</a></li>
            <li><a href="#welcome">Welcome</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#hours">Hours</a></li>
            <li><a href="#contact">Contact</a></li>
            <li class="nav-dropdown"><details>
                <summary>More</summary>
                <ul class="nav-submenu">
                    ${PRIMARY_NAV.filter(item => item.key !== 'home').map(item => navLink(item, activeKey))}
                    ${SIMULATIONS.map(item => navLink(item, activeKey))}
                </ul>
            </details></li>
        </ul>
    </nav>`;
    }
    const simulationActive = SIMULATIONS.some(sim => sim.key === activeKey);
    return html`
    <nav class="site-nav" aria-label="Main navigation">
        <ul class="nav-list">
            ${PRIMARY_NAV.map(item => navLink(item, activeKey))}
            <li class="nav-dropdown">
                <details${simulationActive ? raw(' data-active="true"') : ''}>
                    <summary>Simulations</summary>
                    <ul class="nav-submenu">
                        ${SIMULATIONS.map(item => navLink(item, activeKey))}
                    </ul>
                </details>
            </li>
        </ul>
    </nav>`;
}

function layout({ key, title, description, body, loadApps = true }) {
    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const scripts = loadApps
        ? html`
    <script>window.GreenhouseSiteConfig = ${raw(serializeForScript(clientConfig()))};</script>
    <script src="/js/GreenhouseUtils.js"></script>
    <script src="/js/greenhouse.js"></script>`
        : '';

    return html`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${description || 'Greenhouse for Mental Health Development: mental health education, resources and interactive simulations.'}">
    <link rel="icon" type="image/png" href="/images/Greenhouse_Logo.png">
    <link rel="stylesheet" href="/site/site.css">
</head>
<body class="page-${key}">
    <a class="skip-link" href="#main">Skip to main content</a>
    <header class="site-header">
        <div class="site-header-inner">
            <a class="site-brand" href="/">
                <img src="/images/greenhouse-site-logo.png" alt="Greenhouse for Mental Health Development — Bloom into your better self" width="114" height="151">
            </a>
            ${navigation(key)}
        </div>
    </header>
    <main id="main" class="site-main" tabindex="-1">
        ${body}
    </main>
    <footer class="site-footer">
        <p>&copy; ${new Date().getFullYear()} ${SITE_NAME} Development. Educational content only; not a substitute for professional care.</p>
        <p>If you are in crisis, call or text <a href="tel:988">988</a> (Suicide &amp; Crisis Lifeline, US).</p>
    </footer>${scripts}
</body>
</html>
`.toString();
}

module.exports = { layout };

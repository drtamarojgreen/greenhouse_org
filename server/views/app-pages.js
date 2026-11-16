'use strict';

const { html } = require('../html');
const { containerId } = require('../site');

const NOSCRIPT = html`<noscript><p class="notice">This interactive feature requires JavaScript to be enabled.</p></noscript>`;

function quizzesPage({ quizzes }) {
    const list = Array.isArray(quizzes.quizzes) ? quizzes.quizzes : [];
    return {
        key: 'quizzes',
        title: 'Quizzes',
        description: 'Test your knowledge with Greenhouse research quizzes.',
        body: html`
        <section class="page-header">
            <h1>Quizzes</h1>
            <p class="lead">Test your understanding of the science behind mental health.</p>
            ${list.length ? html`<ul class="inline-list">${list.map(q => html`<li>${q.title}</li>`)}</ul>` : ''}
        </section>
        <div id="hiddenQuizzesData" hidden>${JSON.stringify(quizzes)}</div>
        <section id="${containerId('quizzes')}" class="app-host">${NOSCRIPT}</section>`
    };
}

function schedulePage() {
    return {
        key: 'schedule',
        title: 'Schedule',
        description: 'Request and manage appointments with Greenhouse for Mental Health.',
        body: html`
        <section class="page-header">
            <h1>Schedule an Appointment</h1>
            <p class="lead">Request a session, review your appointments, or switch views to manage the schedule.</p>
        </section>
        <section id="schedule-app" class="schedule-app" aria-label="Scheduling application">
            <div class="schedule-row">
                <div id="schedule-repeater-left" class="schedule-panel"></div>
                <div id="schedule-repeater-right" class="schedule-panel"></div>
            </div>
            <div class="schedule-row">
                <div id="schedule-dashboard-left" class="schedule-panel"></div>
                <div id="schedule-dashboard-right" class="schedule-panel"></div>
            </div>
            ${NOSCRIPT}
        </section>`
    };
}

function modelsPage({ catalog, modelsData }) {
    return {
        key: 'models',
        title: 'Models',
        description: catalog.intro[0],
        body: html`
        <section class="page-header">
            <h1>Greenhouse Models</h1>
            ${catalog.intro.map(paragraph => html`<p>${paragraph}</p>`)}
        </section>
        <section id="${containerId('models')}" class="app-host simulation-host">${NOSCRIPT}</section>
        <div class="data-bridge" hidden>
            <div id="dataTextElement">${JSON.stringify(modelsData)}</div>
            <section class="wixui-section">
                <div></div>
                <div><div><div><span data-custom-holder="${JSON.stringify(modelsData)}">Models data</span></div></div></div>
            </section>
        </div>`
    };
}

const TECH_PROMOS = [
    { title: 'Component Testing Sandbox', text: 'Interactively test client-side JavaScript modules in a controlled and isolated environment.' },
    { title: 'Backend Simulation', text: 'Develop and debug frontend logic with predictable mock data served by the page.' },
    { title: 'Dynamic Module Loading', text: 'Verify the integration of dynamically loaded applications such as the Models Prototype.' },
    { title: 'Live DOM Interaction', text: 'Safely manipulate and inspect the live page structure.' }
];

function techPage({ techData }) {
    return {
        key: 'tech',
        title: 'Tech',
        description: 'Greenhouse technology testing sandbox.',
        body: html`
        <div class="tech-layout">
            <section id="${containerId('tech')}" class="wixui-section page-header">
                <div></div>
                <div>
                    <div>
                        <div><h1>Technology at the Greenhouse</h1></div>
                        <div><p><span><span id="dataTextElement" hidden>${JSON.stringify(techData)}</span></span></p></div>
                    </div>
                </div>
            </section>
            <div></div>
            <section class="wixui-column-strip content-section">
                <div></div>
                <div class="card-grid">
                    ${TECH_PROMOS.map(promo => html`
                    <div class="card">
                        <div></div>
                        <div><div>
                            <div></div>
                            <div><h2>${promo.title}</h2></div>
                            <div><p><span><span><span>${promo.text}</span></span></span></p></div>
                        </div></div>
                    </div>`)}
                </div>
            </section>
        </div>`
    };
}

function simulationPage({ simulation, model }) {
    const title = model ? model.title : simulation.label;
    const paragraphs = model ? model.paragraphs : [];
    const isGenetic = simulation.key === 'genetic';

    return {
        key: simulation.key,
        title,
        description: paragraphs[0],
        body: html`
        <section class="page-header">
            <h1>${title}</h1>
            ${paragraphs[0] ? html`<p class="lead">${paragraphs[0]}</p>` : ''}
        </section>
        ${isGenetic ? html`<div id="genetic-app-title"></div><div id="genetic-app-paragraph"></div>` : ''}
        <section id="${containerId(simulation.key)}" class="app-host simulation-host" aria-label="${title} simulation">${NOSCRIPT}</section>
        ${paragraphs.length > 1 ? html`
        <section class="content-section">
            <details class="about-model">
                <summary>About the ${title}</summary>
                ${paragraphs.slice(1).map(paragraph => html`<p>${paragraph}</p>`)}
            </details>
        </section>` : ''}`
    };
}

function notFoundPage() {
    return {
        key: 'not-found',
        title: 'Page not found',
        loadApps: false,
        body: html`
        <section class="page-header">
            <h1>Page not found</h1>
            <p class="lead">The page you are looking for does not exist.</p>
            <a class="button button-primary" href="/">Return home</a>
        </section>`
    };
}

function errorPage() {
    return {
        key: 'error',
        title: 'Something went wrong',
        loadApps: false,
        body: html`
        <section class="page-header">
            <h1>Something went wrong</h1>
            <p class="lead">We could not load this page. Please try again later.</p>
            <a class="button button-primary" href="/">Return home</a>
        </section>`
    };
}

module.exports = { quizzesPage, schedulePage, modelsPage, techPage, simulationPage, notFoundPage, errorPage };

'use strict';

const SITE_NAME = 'Greenhouse for Mental Health';

const SIMULATIONS = [
    { key: 'genetic', path: '/genetic', label: 'Genetic' },
    { key: 'neuro', path: '/neuro', label: 'Neuro' },
    { key: 'pathway', path: '/pathway', label: 'Pathway' },
    { key: 'synapse', path: '/synapse', label: 'Synapse' },
    { key: 'dopamine', path: '/dopamine', label: 'Dopamine' },
    { key: 'serotonin', path: '/serotonin', label: 'Serotonin' },
    { key: 'dna', path: '/dna', label: 'DNA Repair' },
    { key: 'rna', path: '/rna', label: 'RNA Repair' },
    { key: 'emotion', path: '/emotion', label: 'Emotion' },
    { key: 'cognition', path: '/cognition', label: 'Cognition' },
    { key: 'inflammation', path: '/inflammation', label: 'Neuroinflammation' },
    { key: 'stress', path: '/stress', label: 'Stress' }
];

const PRIMARY_NAV = [
    { key: 'home', path: '/', label: 'Home' },
    { key: 'books', path: '/books', label: 'Books' },
    { key: 'news', path: '/news', label: 'News' },
    { key: 'videos', path: '/videos', label: 'Videos' },
    { key: 'inspiration', path: '/inspiration', label: 'Inspiration' },
    { key: 'quizzes', path: '/quizzes', label: 'Quizzes' },
    { key: 'schedule', path: '/schedule', label: 'Schedule' },
    { key: 'models', path: '/models', label: 'Models' },
    { key: 'tech', path: '/tech', label: 'Tech' }
];

const containerId = key => `${key}-app-container`;

const SELECTORS = {
    patient: '#schedule-repeater-left',
    patientRight: '#schedule-repeater-right',
    dashboardLeft: '#schedule-dashboard-left',
    dashboardRight: '#schedule-dashboard-right',
    admin: '#schedule-repeater-left',
    repeaterContainer: '#schedule-app',
    repeaterLeft: '#schedule-repeater-left',
    repeaterRight: '#schedule-repeater-right',
    books: `#${containerId('books')}`,
    news: `#${containerId('news')}`,
    videos: `#${containerId('videos')}`,
    quizzes: `#${containerId('quizzes')}`,
    models: `#${containerId('models')}`,
    tech: `#${containerId('tech')}`,
    geneticTitle: '#genetic-app-title',
    geneticParagraph: '#genetic-app-paragraph',
    ...Object.fromEntries(SIMULATIONS.map(sim => [sim.key, `#${containerId(sim.key)}`]))
};

function clientConfig() {
    return {
        baseUrl: '/',
        siteOrigin: '',
        selectors: SELECTORS
    };
}

module.exports = { SITE_NAME, SIMULATIONS, PRIMARY_NAV, SELECTORS, containerId, clientConfig };

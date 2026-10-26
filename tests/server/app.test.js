'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../../app');
const { PAGE_PATHS } = require('../../server/routes');
const { PRIMARY_NAV, SIMULATIONS, SELECTORS } = require('../../server/site');

let server;
let baseUrl;

test.before(async () => {
    server = createApp().listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise(resolve => server.close(resolve)));

const get = path => fetch(`${baseUrl}${path}`);
const send = (method, path, body) => fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
});

test('every navigation route renders a page with the shared navigation', async () => {
    const navPaths = [...PRIMARY_NAV, ...SIMULATIONS].map(item => item.path);
    assert.deepEqual([...navPaths].sort(), [...PAGE_PATHS].sort());
    for (const path of navPaths) {
        const res = await get(path);
        assert.equal(res.status, 200, path);
        assert.match(res.headers.get('content-type'), /text\/html/);
        const body = await res.text();
        for (const link of navPaths) {
            assert.ok(body.includes(`href="${link}"`), `${path} links to ${link}`);
        }
        assert.ok(body.includes(`href="${path}" aria-current="page"`), `${path} marks itself as current`);
        assert.ok(body.includes('<script src="/js/greenhouse.js"></script>'), `${path} loads the loader`);
        assert.ok(body.includes('window.GreenhouseSiteConfig'), `${path} configures the loader`);
    }
});

test('landing page renders the archived homepage content', async () => {
    const body = await (await get('/')).text();
    assert.match(body, /Bloom into your better self/);
    assert.match(body, /Providing supportive mental health growth/);
});

test('content pages render server-side data', async () => {
    assert.match(await (await get('/books')).text(), /The Psychobiographer&#39;s Handbook/);
    assert.match(await (await get('/news')).text(), /Decoding the Brain/);
    assert.match(await (await get('/inspiration')).text(), /Wherever you go, there you are\./);
    assert.match(await (await get('/videos')).text(), /Understanding Emotional Resilience/);
});

test('application pages render the containers the loader targets', async () => {
    const checks = {
        '/books': [SELECTORS.books],
        '/news': [SELECTORS.news],
        '/quizzes': [SELECTORS.quizzes, '#hiddenQuizzesData'],
        '/models': [SELECTORS.models],
        '/tech': [SELECTORS.tech, '#dataTextElement'],
        '/schedule': [SELECTORS.dashboardLeft, SELECTORS.dashboardRight, SELECTORS.repeaterLeft, SELECTORS.repeaterRight],
        '/genetic': [SELECTORS.genetic, SELECTORS.geneticTitle, SELECTORS.geneticParagraph]
    };
    for (const sim of SIMULATIONS) {
        checks[sim.path] = checks[sim.path] || [SELECTORS[sim.key]];
    }
    for (const [path, selectors] of Object.entries(checks)) {
        const body = await (await get(path)).text();
        for (const selector of selectors) {
            assert.ok(body.includes(`id="${selector.slice(1)}"`), `${path} contains ${selector}`);
        }
    }
});

test('models page provides the data bridge expected by models_data.js', async () => {
    const body = await (await get('/models')).text();
    assert.match(body, /<section class="wixui-section">\s*<div><\/div>\s*<div><div><div><span data-custom-holder="\{&quot;brain&quot;/);
});

test('unknown routes return a 404 page', async () => {
    const res = await get('/does-not-exist');
    assert.equal(res.status, 404);
    assert.match(await res.text(), /Page not found/);
});

test('static assets are served from docs without exposing other files', async () => {
    assert.equal((await get('/js/GreenhouseUtils.js')).status, 200);
    assert.equal((await get('/css/schedule.css')).status, 200);
    assert.equal((await get('/endpoints/quizzes.json')).status, 200);
    assert.equal((await get('/images/brain.svg')).status, 200);
    assert.equal((await get('/site/site.css')).status, 200);
    assert.equal((await get('/js/missing.js')).status, 404);
    assert.equal((await get('/js/%2e%2e/%2e%2e/app.js')).status, 404);
    assert.equal((await get('/package.json')).status, 404);
});

test('content functions replace the managed backend', async () => {
    for (const name of ['getBooks', 'getNews', 'getInspiration']) {
        const data = await (await get(`/_functions/${name}`)).json();
        assert.ok(Array.isArray(data.items) && data.items.length > 0, name);
    }
    const videos = await (await get('/_functions/getLatestVideosFromFeed')).json();
    assert.ok(videos.every(v => v.embedUrl && v.url));
    const services = await (await get('/_functions/getServices')).json();
    assert.ok(services.every(s => s._id && s.name));
    assert.equal((await get('/_functions/unknown')).status, 404);
});

test('appointment functions support the scheduler workflow', async () => {
    const appointment = {
        title: 'Intake',
        date: '2030-01-07',
        time: '10:00',
        platform: 'Zoom',
        serviceRef: 'svc_001',
        start: '2030-01-07T10:00:00.000Z',
        end: '2030-01-07T11:00:00.000Z'
    };

    assert.equal((await send('POST', '/_functions/proposeAppointment', appointment)).status, 200);
    const createdRes = await send('POST', '/_functions/createAppointment', appointment);
    assert.equal(createdRes.status, 201);
    const created = await createdRes.json();
    assert.ok(created._id);

    const conflict = await send('POST', '/_functions/proposeAppointment', { ...appointment, start: '2030-01-07T10:30:00.000Z', end: '2030-01-07T11:30:00.000Z' });
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).conflicts.length, 1);

    const second = await (await send('POST', '/_functions/createAppointment', { ...appointment, title: 'Overlap', start: '2030-01-07T10:30:00.000Z', end: '2030-01-07T11:30:00.000Z' })).json();
    const conflicts = await (await get('/_functions/getConflictsForDateRange?startDate=2030-01-07&endDate=2030-01-13')).json();
    assert.equal(conflicts.length, 1);
    assert.equal((await send('POST', '/_functions/resolveConflict', { conflictId: conflicts[0].id, resolution: 'reschedule' })).status, 200);
    assert.equal((await (await get('/_functions/getConflictsForDateRange?startDate=2030-01-07&endDate=2030-01-13')).json()).length, 0);

    const inRange = await (await get('/_functions/getAppointmentsByDateRange?startDate=2030-01-07&endDate=2030-01-07')).json();
    assert.equal(inRange.length, 2);
    assert.equal((await get('/_functions/getAppointmentsByDateRange')).status, 400);

    const updated = await (await send('PUT', `/_functions/updateAppointment/${created._id}`, { appointmentId: created._id, updatedData: { title: 'Updated intake' } })).json();
    assert.equal(updated.title, 'Updated intake');
    assert.equal((await send('PUT', '/_functions/updateAppointmentStatus', { appointmentId: created._id, status: 'confirmed' })).status, 200);
    const fetched = await (await get(`/_functions/getAppointmentById/${created._id}`)).json();
    assert.equal(fetched.status, 'confirmed');

    assert.equal((await send('DELETE', `/_functions/deleteAppointment/${second._id}`)).status, 200);
    assert.equal((await send('DELETE', `/_functions/deleteAppointment/${second._id}`)).status, 404);
    const all = await (await get('/_functions/getAppointments')).json();
    assert.deepEqual(all.map(a => a._id), [created._id]);
});

test('appointment functions validate input', async () => {
    assert.equal((await send('POST', '/_functions/createAppointment', { title: 'x', start: 'bad', end: 'bad' })).status, 400);
    assert.equal((await send('POST', '/_functions/createAppointment', { title: 'x', start: '2030-01-01T11:00:00Z', end: '2030-01-01T10:00:00Z' })).status, 400);
    assert.equal((await send('POST', '/_functions/createAppointment', [])).status, 400);
    const malformed = await fetch(`${baseUrl}/_functions/createAppointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not json'
    });
    assert.equal(malformed.status, 400);
    assert.equal((await send('PUT', '/_functions/updateAppointment/missing', { title: 'x' })).status, 404);
    assert.equal((await send('PUT', '/_functions/updateAppointmentStatus', {})).status, 400);
    assert.equal((await send('POST', '/_functions/resolveConflict', {})).status, 400);
});

/**
 * @file quizzes.js
 * @description Quizzes application Version 1.5.0 (The Physical Sentinel).
 * Uses physical DOM nodes and dual-resilience (Observer + Sentinel) to survive Wix resets.
 */

(function() {
    'use strict';

    console.log("🟢 [Quizzes] Loading Version 1.5.0 (Physical Sentinel Mode)");

    const G = window.GreenhouseUtils;
    if (!G) {
        console.error("❌ [Quizzes] GreenhouseUtils not found.");
        return;
    }

    const appState = {
        isInitialized: false,
        isLoading: false,
        isRunning: false,
        targetElement: null,
        baseUrl: null,
        targetSelector: null,
        
        quizzes: [],
        currentQuiz: null,
        currentIndex: 0,
        score: 0,
        hasAnswered: false,
        lastSelectedIdx: null
    };

    /**
     * @description The script element that is currently being executed.
     * This is used to retrieve configuration attributes from the loader script.
     * @type {HTMLScriptElement}
     */
    const scriptElement = document.currentScript;

    /**
     * @function validateConfiguration
     * @description Validates the configuration passed from the loader script.
     * Autonomous implementation matching books.js/news.js pattern.
     */
    function validateConfiguration() {
        const globalAttributes = window._greenhouseScriptAttributes || {};

        appState.targetSelector = globalAttributes['target-selector-left']
                                 || scriptElement?.getAttribute('data-target-selector-left')
                                 || scriptElement?.getAttribute('data-target-selector');

        appState.baseUrl = globalAttributes['base-url'] || scriptElement?.getAttribute('data-base-url');
        const view = globalAttributes['view'] || scriptElement?.getAttribute('data-view');

        if (!appState.targetSelector) {
            console.error('Quizzes: Missing required data-target-selector attribute');
            return false;
        }

        if (!appState.baseUrl) {
            console.error('Quizzes: Missing required data-base-url attribute');
            return false;
        }

        if (!appState.baseUrl.endsWith('/')) {
            appState.baseUrl += '/';
        }

        appState.currentView = view || new URLSearchParams(window.location.search).get('view') || 'default';

        console.log(`Quizzes: Configuration validated - View: ${appState.currentView}, Target: ${appState.targetSelector}`);
        return true;
    }

    /**
     * @function createElement
     * @description Robust element creator matching Greenhouse standards.
     */
    function createElement(tag, attrs = {}, ...children) {
        const el = document.createElement(tag);
        for (const k in attrs) {
            if (k === 'onclick' && typeof attrs[k] === 'function') el.onclick = attrs[k];
            else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(el.style, attrs[k]);
            else el.setAttribute(k, attrs[k]);
        }
        children.forEach(child => {
            if (typeof child === 'string') el.appendChild(document.createTextNode(child));
            else if (child instanceof Node) el.appendChild(child);
        });
        return el;
    }

    /**
     * @function fetchQuizData
     * @description Priority: Velo Bridge -> Remote JSON.
     */
    async function fetchQuizData() {
        const bridge = document.querySelector('#hiddenQuizzesData');
        if (bridge?.textContent?.trim()) {
            try {
                const data = JSON.parse(bridge.textContent);
                appState.quizzes = data.quizzes || [];
                console.log("Quizzes: Data bridged from Velo");
            } catch(e) { console.warn("Quizzes: Bridge parse error"); }
        }

        if (appState.quizzes.length === 0) {
            const res = await fetch(`${appState.baseUrl}endpoints/quizzes.json`);
            const data = await res.json();
            appState.quizzes = data.quizzes || [];
            console.log("Quizzes: Data fetched from remote");
        }
        appState.currentQuiz = appState.quizzes[0];
    }

    function handleChoice(idx) {
        if (appState.hasAnswered) return;
        appState.hasAnswered = true;
        appState.lastSelectedIdx = idx;
        const q = appState.currentQuiz.questions[appState.currentIndex];
        if (idx === q.answer) appState.score++;
        renderUI();
    }

    function next() {
        if (appState.currentIndex + 1 < appState.currentQuiz.questions.length) {
            appState.currentIndex++;
            appState.hasAnswered = false;
            renderUI();
        } else {
            renderResults();
        }
    }

    /**
     * @function renderResults
     * @description Final completion view.
     */
    function renderResults() {
        const content = document.getElementById('quizzes-content-root');
        if (!content) return;
        content.innerHTML = '';

        const perc = Math.round((appState.score / appState.currentQuiz.questions.length) * 100);
        
        const results = createElement('div', { style: { textAlign: 'center', padding: '40px' } },
            createElement('h3', { style: { color: '#4ca1af', fontSize: '2rem' } }, 'Assessment Complete'),
            createElement('p', { style: { fontSize: '1.5rem', margin: '20px 0' } }, `Score: ${appState.score} / ${appState.currentQuiz.questions.length}`),
            createElement('button', { 
                style: { background: '#4ca1af', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
                onclick: () => { appState.currentIndex = 0; appState.score = 0; appState.hasAnswered = false; renderUI(); }
            }, 'Retake Quiz')
        );

        content.appendChild(results);
    }

    /**
     * @function renderUI
     * @description The core UI engine using physical nodes.
     */
    function renderUI() {
        const contentArea = document.getElementById('quizzes-content-root');
        if (!contentArea || !appState.currentQuiz) return;

        contentArea.innerHTML = ''; // Clear only the content sub-container
        const q = appState.currentQuiz.questions[appState.currentIndex];
        const total = appState.currentQuiz.questions.length;

        // 1. Question Header
        const header = createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' } },
            createElement('span', { style: { color: '#4ca1af', fontWeight: 'bold' } }, `Question ${appState.currentIndex + 1} / ${total}`),
            createElement('span', { style: { color: '#4ca1af' } }, `Score: ${appState.score}`)
        );

        // 2. Question Text
        const questionText = createElement('p', { style: { fontSize: '1.4rem', lineHeight: '1.5', margin: '30px 0', color: '#fff' } }, q.question);

        // 3. Choices
        const choicesList = createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } });
        q.choices.forEach((choice, idx) => {
            let btnStyle = { textAlign: 'left', padding: '20px', borderRadius: '10px', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', color: '#fff' };
            
            if (appState.hasAnswered) {
                btnStyle.cursor = 'default';
                if (idx === q.answer) {
                    btnStyle.background = 'rgba(46, 204, 113, 0.3)';
                    btnStyle.border = '2px solid #2ecc71';
                } else if (idx === appState.lastSelectedIdx) {
                    btnStyle.background = 'rgba(231, 76, 60, 0.3)';
                    btnStyle.border = '2px solid #e74c3c';
                } else {
                    btnStyle.background = 'rgba(255,255,255,0.02)';
                    btnStyle.border = '1px solid #333';
                    btnStyle.color = '#666';
                }
            } else {
                btnStyle.background = 'rgba(255,255,255,0.05)';
                btnStyle.border = '1px solid rgba(76, 161, 175, 0.4)';
            }

            choicesList.appendChild(createElement('button', { style: btnStyle, onclick: () => handleChoice(idx) }, choice));
        });

        // 4. Feedback Area
        const feedback = appState.hasAnswered ? createElement('div', { style: { marginTop: '30px', padding: '25px', background: 'rgba(76,161,175,0.1)', borderLeft: '5px solid #4ca1af', borderRadius: '8px' } },
            createElement('p', { style: { margin: '0', color: '#eee', lineHeight: '1.6' } }, 
                createElement('strong', { style: { color: '#4ca1af', display: 'block', marginBottom: '10px' } }, 'Research Context:'),
                q.explanation
            ),
            createElement('button', { 
                style: { marginTop: '20px', background: '#4ca1af', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
                onclick: next
            }, appState.currentIndex + 1 < total ? 'Next Question' : 'View Results')
        ) : null;

        contentArea.appendChild(header);
        contentArea.appendChild(questionText);
        contentArea.appendChild(choicesList);
        if (feedback) contentArea.appendChild(feedback);
    }

    /**
     * @function initialize
     * @description Robust initialization sequence.
     */
    async function initialize(passedContainer = null, passedSelector = null) {
        if (appState.isLoading) return;
        appState.isLoading = true;

        try {
            if (!validateConfiguration()) return;
            
            // Priority: Passed container > Found element
            appState.targetSelector = passedSelector || appState.targetSelector;
            appState.baseUrl = appState.baseUrl;

            if (passedContainer && document.body.contains(passedContainer)) {
                appState.targetElement = passedContainer;
            } else {
                appState.targetElement = await G.waitForElement(appState.targetSelector);
            }
            
            // Reduced Settlement Delay (500ms) - Matches books.js pattern
            console.log("⏳ [Quizzes] 500ms React settlement in progress...");
            await new Promise(r => setTimeout(r, 500));

            // Final check after delay to ensure we have the latest container
            const currentContainer = document.querySelector(appState.targetSelector);
            if (currentContainer && currentContainer !== appState.targetElement) {
                console.log("Quizzes: Container changed during settlement, updating target.");
                appState.targetElement = currentContainer;
            }

            // Physical Node Construction
            appState.targetElement.innerHTML = '';
            const root = createElement('section', { 
                id: 'greenhouse-quizzes-sentry',
                style: { width: '100%', padding: '40px', background: 'rgba(15,15,15,0.98)', borderRadius: '24px', border: '3px solid #4ca1af', boxSizing: 'border-box', fontFamily: 'Quicksand, sans-serif', color: '#fff', minHeight: '500px' }
            },
                createElement('h2', { style: { color: '#4ca1af', margin: '0 0 20px 0', fontWeight: '300', letterSpacing: '1px' } }, 'Greenhouse Research Quizzes'),
                createElement('div', { id: 'quizzes-content-root' }, '⏳ Loading quiz modules...')
            );

            appState.targetElement.prepend(root);
            await fetchQuizData();
            renderUI();
            
            appState.isInitialized = true;
            appState.isRunning = true;
            window.GreenhouseQuizzes.isRunning = true; // Sync public API

            // Resilience Hooks
            G.observeAndReinitializeApplication(appState.targetElement, appState.targetSelector, window.GreenhouseQuizzes, 'initialize');
            G.startSentinel(appState.targetElement, appState.targetSelector, window.GreenhouseQuizzes, 'initialize', '#quizzes-content-root');

            console.log("🚀 [Quizzes] v1.5.0 Sentry + Sentinel Active");

        } catch (error) {
            console.error("❌ [Quizzes] Initialization failed:", error);
        } finally {
            appState.isLoading = false;
        }
    }

    window.GreenhouseQuizzes = {
        initialize: initialize,
        isRunning: false // Boolean property instead of function to prevent clobbering issues
    };

    initialize();

})();

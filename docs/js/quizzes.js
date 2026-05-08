/**
 * @file quizzes.js
 * @description Quizzes application Version 1.4.0 (The Resilient Engine).
 * Implements robust delegated interaction, state-persistent progression, and Sentry resilience.
 */

(function() {
    'use strict';

    console.log("🟢 [Quizzes] Loading Version 1.4.0 (Resilient Engine Mode)");

    const G = window.GreenhouseUtils;
    if (!G) return;

    const appState = {
        isInitialized: false,
        isLoading: false,
        isRunning: false,
        targetElement: null,
        baseUrl: null,
        targetSelector: null,
        
        // Data
        quizzes: [],
        currentQuiz: null,
        
        // Progression State (Persistent across Wix DOM resets)
        currentIndex: 0,
        score: 0,
        hasAnswered: false,
        lastSelectedIdx: null
    };

    /**
     * @function fetchQuizData
     * @description Bridges Velo data or fetches remote JSON.
     */
    async function fetchQuizData() {
        const veloData = document.querySelector('#hiddenQuizzesData');
        if (veloData?.textContent?.trim()) {
            try {
                const data = JSON.parse(veloData.textContent);
                appState.quizzes = data.quizzes || [];
                console.log("Quizzes: Data sync via Bridge successful");
            } catch(e) { console.warn("Quizzes: Bridge sync failed"); }
        }

        if (appState.quizzes.length === 0) {
            const res = await fetch(`${appState.baseUrl}endpoints/quizzes.json`);
            const data = await res.json();
            appState.quizzes = data.quizzes || [];
            console.log("Quizzes: Data sync via Remote successful");
        }
        
        appState.currentQuiz = appState.quizzes[0];
    }

    /**
     * @function handleChoiceClick
     * @description Core logic for choice selection and scoring.
     */
    function handleChoiceClick(idx) {
        if (appState.hasAnswered) return;
        
        const q = appState.currentQuiz.questions[appState.currentIndex];
        appState.hasAnswered = true;
        appState.lastSelectedIdx = idx;
        
        if (idx === q.answer) {
            appState.score++;
        }
        
        renderUI(); // Re-render to show feedback
    }

    /**
     * @function progressQuiz
     * @description Advances to next question or final results.
     */
    function progressQuiz() {
        if (appState.currentIndex + 1 < appState.currentQuiz.questions.length) {
            appState.currentIndex++;
            appState.hasAnswered = false;
            appState.lastSelectedIdx = null;
            renderUI();
        } else {
            renderResults();
        }
    }

    /**
     * @function renderResults
     * @description Final completion card logic.
     */
    function renderResults() {
        const container = appState.targetElement;
        const total = appState.currentQuiz.questions.length;
        const perc = Math.round((appState.score / total) * 100);
        
        container.innerHTML = `
            <div id="quiz-results-node" style="padding: 60px 30px; background: #000; border: 4px solid #4ca1af; border-radius: 24px; color: #fff; font-family: 'Quicksand', sans-serif; text-align: center; animation: fadeIn 0.8s ease;">
                <h2 style="color: #4ca1af; font-size: 2.8rem; margin: 0; letter-spacing: 1px;">KNOWLEDGE CHECK COMPLETE</h2>
                <div style="font-size: 6rem; margin: 40px 0;">${perc >= 70 ? '🏆' : '📚'}</div>
                <p style="font-size: 2rem; margin-bottom: 10px;">${appState.score} / ${total} Correct</p>
                <p style="color: #4ca1af; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 2px;">Greenhouse Research Rank: ${perc >= 80 ? 'Master' : 'Practitioner'}</p>
                
                <div style="margin-top: 50px;">
                    <button id="quiz-restart-btn" style="background: #4ca1af; color: #fff; border: none; padding: 18px 45px; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 1.1rem; transition: transform 0.2s;">
                        Retake ADHD Assessment
                    </button>
                </div>
            </div>
        `;

        document.getElementById('quiz-restart-btn').onclick = () => {
            appState.currentIndex = 0;
            appState.score = 0;
            appState.hasAnswered = false;
            renderUI();
        };
    }

    /**
     * @function renderUI
     * @description Main interactive UI engine.
     */
    function renderUI() {
        const container = appState.targetElement;
        if (!container || !appState.currentQuiz) return;

        const q = appState.currentQuiz.questions[appState.currentIndex];
        const total = appState.currentQuiz.questions.length;
        
        container.innerHTML = `
            <div id="quizzes-engine-root" style="padding: 40px; background: #000; border: 3px solid #4ca1af; border-radius: 20px; color: #fff; font-family: 'Quicksand', sans-serif; box-sizing: border-box; min-height: 550px; position: relative;">
                
                <!-- Progress Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(76, 161, 175, 0.3); padding-bottom: 15px; margin-bottom: 30px;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: #4ca1af; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">ADHD Neurobiology Series</span>
                        <h2 style="color: #fff; margin: 0; font-size: 1.4rem; font-weight: 300;">${appState.currentQuiz.title}</h2>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: #4ca1af; font-weight: bold; font-size: 1.2rem;">${appState.currentIndex + 1} <small style="color: #666; font-size: 0.8rem;">/ ${total}</small></span>
                    </div>
                </div>

                <!-- Question -->
                <p style="font-size: 1.5rem; margin: 30px 0 40px 0; line-height: 1.45; font-weight: 300;">${q.question}</p>
                
                <!-- Choices Grid -->
                <div id="choices-anchor" style="display: flex; flex-direction: column; gap: 15px;">
                    ${q.choices.map((choice, idx) => {
                        let dynamicStyle = "background: rgba(255,255,255,0.04); border: 1px solid rgba(76, 161, 175, 0.4); cursor: pointer;";
                        
                        if (appState.hasAnswered) {
                            if (idx === q.answer) {
                                dynamicStyle = "background: rgba(46, 204, 113, 0.2); border: 2px solid #2ecc71; cursor: default;";
                            } else if (idx === appState.lastSelectedIdx) {
                                dynamicStyle = "background: rgba(231, 76, 60, 0.2); border: 2px solid #e74c3c; cursor: default; opacity: 0.7;";
                            } else {
                                dynamicStyle = "background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); color: #555; cursor: default;";
                            }
                        }

                        return `<button class="choice-node" data-idx="${idx}" style="text-align: left; padding: 22px; color: #fff; border-radius: 14px; font-size: 1.15rem; font-family: 'Quicksand', sans-serif; transition: all 0.25s ease; ${dynamicStyle}">${choice}</button>`;
                    }).join('')}
                </div>

                <!-- Feedback & Progression -->
                ${appState.hasAnswered ? `
                    <div style="margin-top: 40px; padding: 30px; background: rgba(255,255,255,0.03); border-left: 5px solid #4ca1af; border-radius: 12px; animation: slideUp 0.5s ease;">
                        <p style="margin: 0; line-height: 1.6; color: #ccc; font-size: 1.1rem;">
                            <strong style="color: #4ca1af; text-transform: uppercase; font-size: 0.8rem; display: block; margin-bottom: 10px;">The Greenhouse Insight</strong>
                            ${q.explanation}
                        </p>
                        <div style="margin-top: 25px; text-align: right;">
                            <button id="quiz-continue-btn" style="background: #4ca1af; color: #fff; border: none; padding: 14px 35px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                                ${appState.currentIndex + 1 < total ? 'Next Question →' : 'View Final Results'}
                            </button>
                        </div>
                    </div>
                ` : ''}

                <!-- Progress Bar -->
                <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-bottom-left-radius: 20px; border-bottom-right-radius: 20px; overflow: hidden;">
                    <div style="width: ${((appState.currentIndex + 1) / total) * 100}%; height: 100%; background: #4ca1af; transition: width 0.4s ease;"></div>
                </div>
            </div>

            <style>
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .choice-node:not([disabled]):hover { background: rgba(76, 161, 175, 0.15) !important; border-color: #4ca1af !important; transform: translateX(5px); }
            </style>
        `;

        // Delegated logic: Re-attach listeners to the fresh nodes
        container.querySelectorAll('.choice-node').forEach(btn => {
            if (!appState.hasAnswered) {
                btn.onclick = () => handleChoiceClick(parseInt(btn.dataset.idx));
            }
        });

        if (appState.hasAnswered) {
            const nextBtn = document.getElementById('quiz-continue-btn');
            if (nextBtn) nextBtn.onclick = progressQuiz;
        }
    }

    /**
     * @function initialize
     * @description Standard high-resilience initialization sequence.
     */
    async function initialize() {
        if (appState.isLoading) return;
        appState.isLoading = true;

        try {
            if (!G.validateConfiguration()) return;
            appState.targetSelector = G.appState.targetSelectorLeft;
            appState.baseUrl = G.appState.baseUrl;

            // wait for the anchor
            appState.targetElement = await G.waitForElement(appState.targetSelector);
            
            // React Settlement Delay
            console.log("⏳ [Quizzes] Applying 5s React settlement...");
            await new Promise(r => setTimeout(r, 5000));

            // Sync data and boot UI
            await fetchQuizData();
            renderUI();
            
            appState.isInitialized = true;
            appState.isRunning = true;

            // Sentry: Survive Wix DOM sweeps
            G.observeAndReinitializeApplication(
                appState.targetElement, 
                appState.targetSelector, 
                window.GreenhouseQuizzes, 
                'initialize'
            );

            console.log("🚀 [Quizzes] Interactive Sentry Engine v1.4.0 Active");

        } catch (error) {
            console.error("❌ [Quizzes] Engine failure:", error);
        } finally {
            appState.isLoading = false;
        }
    }

    // Resilience API
    window.GreenhouseQuizzes = {
        initialize: initialize,
        isRunning: () => appState.isRunning
    };

    initialize();

})();

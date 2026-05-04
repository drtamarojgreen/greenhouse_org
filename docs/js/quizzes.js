/**
 * @file quizzes.js
 * @description Core functionality for the Greenhouse quizzes application.
 * Follows the high-resilience pattern established in books.js.
 */

(function() {
    'use strict';

    console.log("🟢 Loading Greenhouse Quizzes - Version 1.1.0");

    /**
     * @description Configuration for the quizzes application
     */
    const config = {
        loadTimeout: 15000,
        retries: {
            maxAttempts: 3,
            delay: 1000
        },
        dom: {
            insertionDelay: 1000,
            observerTimeout: 15000,
            veloDataSelector: '#hiddenQuizzesData'
        }
    };

    const scriptElement = document.currentScript;

    /**
     * Application state management
     */
    const appState = {
        isInitialized: false,
        isLoading: false,
        currentQuiz: null,
        currentQuestionIndex: 0,
        score: 0,
        targetElement: null,
        baseUrl: null,
        targetSelector: null,
        quizzes: [],
        errors: [],
        hasCriticalError: false
    };

    /**
     * @function validateConfiguration
     * @description Validates configuration from loader script
     */
    function validateConfiguration() {
        const globalAttributes = window._greenhouseScriptAttributes || {};

        appState.targetSelector = globalAttributes['target-selector-left']
                                 || scriptElement?.getAttribute('data-target-selector-left')
                                 || scriptElement?.getAttribute('data-target-selector');

        appState.baseUrl = globalAttributes['base-url'] || scriptElement?.getAttribute('data-base-url');

        if (!appState.targetSelector && window.GreenhouseUtils?.appState) {
            appState.targetSelector = window.GreenhouseUtils.appState.targetSelectorLeft;
        }
        if (!appState.baseUrl && window.GreenhouseUtils?.appState) {
            appState.baseUrl = window.GreenhouseUtils.appState.baseUrl;
        }

        if (!appState.targetSelector || !appState.baseUrl) {
            console.error('Quizzes: Missing required configuration attributes');
            return false;
        }

        if (!appState.baseUrl.endsWith('/')) appState.baseUrl += '/';
        return true;
    }

    /**
     * @function waitForElement
     * @description Standard Greenhouse element waiter
     */
    function waitForElement(selector, timeout = config.dom.observerTimeout) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) return resolve(element);

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Target element not found: ${selector}`));
            }, timeout);
        });
    }

    /**
     * @namespace GreenhouseAppsQuizzes
     */
    const GreenhouseAppsQuizzes = {
        async fetchQuizzes() {
            // Priority 1: Velo Data Bridge
            const veloDataEl = document.querySelector(config.dom.veloDataSelector);
            if (veloDataEl?.textContent?.trim()) {
                try {
                    const data = JSON.parse(veloDataEl.textContent);
                    appState.quizzes = data.quizzes;
                    console.log("Quizzes: Loaded from Velo Bridge");
                    return;
                } catch (e) { console.warn("Quizzes: Bridge parse failed", e); }
            }

            // Priority 2: Remote Fetch
            try {
                const response = await fetch(`${appState.baseUrl}endpoints/quizzes.json`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                appState.quizzes = data.quizzes;
                console.log("Quizzes: Loaded from Remote JSON");
            } catch (error) {
                console.error("Quizzes: Fetch failed", error);
                throw error;
            }
        },

        renderQuizList() {
            const container = document.getElementById('quizzes-content');
            if (!container) return;
            container.innerHTML = '';

            const grid = createElement('div', { style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;' });
            
            appState.quizzes.forEach(quiz => {
                const quizCard = createElement('div', { 
                    className: 'quiz-card',
                    style: 'background: rgba(255,255,255,0.05); border: 1px solid rgba(76, 161, 175, 0.3); border-radius: 10px; padding: 25px; transition: all 0.3s ease;'
                },
                    createElement('h3', { style: 'margin-top: 0; color: #4ca1af;' }, quiz.title),
                    createElement('p', { style: 'color: #bbb; font-size: 0.95rem; margin: 15px 0;' }, quiz.description),
                    createElement('button', { 
                        className: 'greenhouse-btn',
                        style: 'background: #4ca1af; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: 600;',
                        onclick: () => this.startQuiz(quiz)
                    }, 'Start Quiz')
                );
                grid.appendChild(quizCard);
            });
            container.appendChild(grid);
        },

        startQuiz(quiz) {
            appState.currentQuiz = quiz;
            appState.currentQuestionIndex = 0;
            appState.score = 0;
            this.renderQuestion();
        },

        renderQuestion() {
            const container = document.getElementById('quizzes-content');
            if (!container) return;
            container.innerHTML = '';

            const question = appState.currentQuiz.questions[appState.currentQuestionIndex];
            
            const questionView = createElement('div', { className: 'quiz-question-view' },
                createElement('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 20px;' },
                    createElement('span', { style: 'color: #4ca1af;' }, `Question ${appState.currentQuestionIndex + 1} / ${appState.currentQuiz.questions.length}`),
                    createElement('span', { style: 'color: #4ca1af;' }, `Score: ${appState.score}`)
                ),
                createElement('p', { style: 'font-size: 1.3rem; margin-bottom: 30px;' }, question.question),
                createElement('div', { id: 'choices-container', style: 'display: flex; flex-direction: column; gap: 12px;' })
            );

            const choicesContainer = questionView.querySelector('#choices-container');
            question.choices.forEach((choice, index) => {
                const choiceBtn = createElement('button', {
                    className: 'choice-btn',
                    style: 'text-align: left; padding: 18px; border: 1px solid rgba(76, 161, 175, 0.3); border-radius: 8px; background: rgba(255,255,255,0.03); color: #fff; cursor: pointer;',
                    onclick: (e) => this.handleAnswer(index, e.target)
                }, choice);
                choicesContainer.appendChild(choiceBtn);
            });

            container.appendChild(questionView);
        },

        handleAnswer(selectedIndex, targetBtn) {
            const question = appState.currentQuiz.questions[appState.currentQuestionIndex];
            const isCorrect = selectedIndex === question.answer;
            
            const buttons = targetBtn.parentElement.querySelectorAll('.choice-btn');
            buttons.forEach(btn => btn.disabled = true);

            if (isCorrect) {
                appState.score++;
                targetBtn.style.background = 'rgba(46, 204, 113, 0.2)';
                targetBtn.style.borderColor = '#2ecc71';
            } else {
                targetBtn.style.background = 'rgba(231, 76, 60, 0.2)';
                targetBtn.style.borderColor = '#e74c3c';
                buttons[question.answer].style.background = 'rgba(46, 204, 113, 0.2)';
                buttons[question.answer].style.borderColor = '#2ecc71';
            }

            const feedback = createElement('div', { 
                style: 'margin-top: 30px; padding: 20px; border-radius: 8px; background: rgba(255,255,255,0.05); border-left: 4px solid ' + (isCorrect ? '#2ecc71' : '#e74c3c') + ';'
            },
                createElement('p', { style: 'font-weight: bold; color: ' + (isCorrect ? '#2ecc71' : '#e74c3c') + ';' }, isCorrect ? '✅ Correct!' : '❌ Incorrect.'),
                createElement('p', { style: 'color: #ccc;' }, question.explanation),
                createElement('button', {
                    style: 'margin-top: 15px; background: #4ca1af; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer;',
                    onclick: () => this.nextQuestion()
                }, appState.currentQuestionIndex + 1 < appState.currentQuiz.questions.length ? 'Next Question' : 'Finish Quiz')
            );

            document.getElementById('quizzes-content').appendChild(feedback);
        },

        nextQuestion() {
            appState.currentQuestionIndex++;
            if (appState.currentQuestionIndex < appState.currentQuiz.questions.length) {
                this.renderQuestion();
            } else {
                this.renderResults();
            }
        },

        renderResults() {
            const container = document.getElementById('quizzes-content');
            container.innerHTML = '';
            const percentage = Math.round((appState.score / appState.currentQuiz.questions.length) * 100);
            
            container.appendChild(createElement('div', { style: 'text-align: center; padding: 40px;' },
                createElement('h3', { style: 'font-size: 1.8rem; color: #4ca1af;' }, 'Quiz Complete'),
                createElement('p', { style: 'font-size: 1.4rem;' }, `Score: ${appState.score} / ${appState.currentQuiz.questions.length} (${percentage}%)`),
                createElement('button', {
                    style: 'margin-top: 20px; background: #4ca1af; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer;',
                    onclick: () => this.renderQuizList()
                }, 'Back to List')
            ));
        },

        insertApplication(targetElement) {
            const appContainer = createElement('section', { 
                id: 'greenhouse-quizzes-app',
                className: 'greenhouse-app-container',
                style: 'width: 100%; padding: 30px; background: rgba(0,0,0,0.85); border-radius: 12px; border: 1px solid #4ca1af; box-sizing: border-box; font-family: "Quicksand", sans-serif; color: #fff;'
            });

            appContainer.appendChild(createElement('h2', { style: 'color: #4ca1af; border-bottom: 2px solid #4ca1af; padding-bottom: 10px; margin-top: 0;' }, 'Greenhouse Quizzes'));
            appContainer.appendChild(createElement('div', { id: 'quizzes-content', style: 'margin-top: 20px;' }));
            
            targetElement.prepend(appContainer);
            console.log('Quizzes: Application inserted');
        },

        observeTargetElement(element) {
            if (!element?.parentElement) return;
            const observer = new MutationObserver((mutations) => {
                if (mutations.some(m => Array.from(m.removedNodes).includes(element))) {
                    console.warn('Quizzes: Container removed. Re-initializing.');
                    observer.disconnect();
                    appState.isInitialized = false;
                    main();
                }
            });
            observer.observe(element.parentElement, { childList: true, subtree: true });
        },

        async init(targetSelector, baseUrl) {
            if (appState.isInitialized || appState.isLoading) return;
            appState.isLoading = true;

            try {
                appState.targetSelector = targetSelector;
                appState.baseUrl = baseUrl;
                appState.targetElement = await waitForElement(targetSelector);

                this.insertApplication(appState.targetElement);
                await this.fetchQuizzes();
                this.renderQuizList();
                this.observeTargetElement(appState.targetElement);

                appState.isInitialized = true;
                console.log('Quizzes: Initialization successful');
            } catch (error) {
                console.error('Quizzes: Initialization failed', error);
            } finally {
                appState.isLoading = false;
            }
        }
    };

    function createElement(tag, attributes = {}, ...children) {
        const element = document.createElement(tag);
        for (const k in attributes) { if (attributes.hasOwnProperty(k)) element.setAttribute(k, attributes[k]); }
        children.forEach(child => {
            if (typeof child === 'string') element.appendChild(document.createTextNode(child));
            else if (child instanceof Node) element.appendChild(child);
        });
        return element;
    }

    async function main() {
        if (appState.hasCriticalError) return;
        if (!validateConfiguration()) return;

        window.addEventListener('error', (e) => {
            if (e.filename?.includes('quizzes')) appState.errors.push(e.error);
        });

        await GreenhouseAppsQuizzes.init(appState.targetSelector, appState.baseUrl);
    }

    window.GreenhouseQuizzes = {
        reinitialize: () => { appState.isInitialized = false; return main(); }
    };

    main();
})();

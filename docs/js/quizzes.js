/**
 * @file quizzes.js
 * @description Core functionality for the Greenhouse Quizzes application.
 * This script integrates with Wix Velo by reading quiz data from a hidden DOM element.
 */

(function () {
    'use strict';

    console.log("🟢 Loading Greenhouse Quizzes");

    /** ---------------- CONFIG ---------------- */
    const config = {
        loadTimeout: 15000,
        dom: { 
            insertionDelay: 1000,
            veloDataSelector: '#hiddenQuizzesData' // Selector for the data bridge element
        }
    };

    /** ---------------- STATE ---------------- */
    const appState = {
        isInitialized: false,
        isLoading: false,
        targetElement: null,
        baseUrl: null,
        targetSelector: null,
        quizzes: [],
        currentQuiz: null,
        currentQuestionIndex: 0,
        score: 0
    };

    /** ---------------- UTILITIES ---------------- */
    function createElement(tag, attributes = {}, ...children) {
        const element = document.createElement(tag);
        for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
                element.setAttribute(key, attributes[key]);
            }
        }
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        return element;
    }

    /** ---------------- APP METHODS ---------------- */
    const GreenhouseQuizzes = {
        async fetchQuizzes() {
            console.debug("🌐 fetchQuizzes initiated");
            
            // Priority 1: Read from Wix Velo Data Bridge (hidden text element)
            const veloDataEl = document.querySelector(config.dom.veloDataSelector);
            if (veloDataEl && veloDataEl.textContent && veloDataEl.textContent.trim()) {
                try {
                    console.debug("📑 Found Velo Data Bridge content");
                    const data = JSON.parse(veloDataEl.textContent);
                    appState.quizzes = data.quizzes;
                    return appState.quizzes;
                } catch (e) {
                    console.warn("⚠️ Failed to parse Velo data bridge content", e);
                }
            }

            // Priority 2: Fallback to direct fetch from GitHub Pages
            console.debug("📡 Falling back to direct GitHub fetch");
            try {
                const response = await fetch(`${appState.baseUrl}endpoints/quizzes.json`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                appState.quizzes = data.quizzes;
                return appState.quizzes;
            } catch (error) {
                console.error("❌ All fetch methods failed:", error);
                return [];
            }
        },

        createView() {
            const container = createElement('div', { 
                className: 'greenhouse-quizzes-view', 
                style: 'padding: 20px; font-family: "Quicksand", sans-serif; color: #fff; background: rgba(0,0,0,0.85); border-radius: 12px; border: 1px solid #4ca1af; min-height: 400px;' 
            });

            const header = createElement('h2', { 
                style: 'color: #4ca1af; border-bottom: 2px solid #4ca1af; padding-bottom: 10px; margin-top: 0; font-weight: 300; letter-spacing: 1px;' 
            }, 'Greenhouse Quizzes');

            const content = createElement('div', { id: 'quizzes-content', style: 'margin-top: 20px;' });
            
            container.appendChild(header);
            container.appendChild(content);
            return container;
        },

        renderQuizList() {
            const container = appState.targetElement.querySelector('#quizzes-content');
            container.innerHTML = '';
            
            if (!appState.quizzes || appState.quizzes.length === 0) {
                container.appendChild(createElement('p', { style: 'color: #888;' }, 'No quizzes available at this time. Please check back later.'));
                return;
            }

            const grid = createElement('div', { style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;' });
            
            appState.quizzes.forEach(quiz => {
                const quizCard = createElement('div', { 
                    className: 'quiz-card',
                    style: 'background: rgba(255,255,255,0.05); border: 1px solid rgba(76, 161, 175, 0.3); border-radius: 10px; padding: 25px; transition: all 0.3s ease;'
                },
                    createElement('h3', { style: 'margin-top: 0; color: #4ca1af; font-weight: 500;' }, quiz.title),
                    createElement('p', { style: 'color: #bbb; font-size: 0.95rem; line-height: 1.5; margin: 15px 0;' }, quiz.description),
                    createElement('button', { 
                        className: 'greenhouse-btn',
                        style: 'background: #4ca1af; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%; transition: background 0.2s;',
                        onclick: () => this.startQuiz(quiz)
                    }, 'Start Quiz')
                );
                
                quizCard.onmouseover = () => { quizCard.style.transform = 'translateY(-5px)'; quizCard.style.borderColor = '#4ca1af'; };
                quizCard.onmouseout = () => { quizCard.style.transform = 'translateY(0)'; quizCard.style.borderColor = 'rgba(76, 161, 175, 0.3)'; };

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
            const container = appState.targetElement.querySelector('#quizzes-content');
            container.innerHTML = '';

            const question = appState.currentQuiz.questions[appState.currentQuestionIndex];
            
            const questionView = createElement('div', { className: 'quiz-question-view', style: 'animation: fadeIn 0.5s ease;' },
                createElement('div', { style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;' },
                    createElement('span', { style: 'color: #4ca1af; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;' }, `Question ${appState.currentQuestionIndex + 1} / ${appState.currentQuiz.questions.length}`),
                    createElement('span', { style: 'color: #4ca1af; font-weight: 500;' }, `Score: ${appState.score}`)
                ),
                createElement('p', { style: 'font-size: 1.35rem; line-height: 1.4; margin-bottom: 35px; color: #fff; font-weight: 300;' }, question.question),
                createElement('div', { id: 'choices-container', style: 'display: flex; flex-direction: column; gap: 12px;' })
            );

            const choicesContainer = questionView.querySelector('#choices-container');
            question.choices.forEach((choice, index) => {
                const choiceBtn = createElement('button', {
                    className: 'choice-btn',
                    style: 'text-align: left; padding: 20px; border: 1px solid rgba(76, 161, 175, 0.3); border-radius: 8px; background: rgba(255,255,255,0.03); color: #fff; cursor: pointer; transition: all 0.2s; font-size: 1.05rem; font-family: "Quicksand", sans-serif;',
                    onclick: (e) => this.handleAnswer(index, e.target)
                }, choice);
                
                choiceBtn.onmouseover = () => { if(!choiceBtn.disabled) { choiceBtn.style.background = 'rgba(76, 161, 175, 0.1)'; choiceBtn.style.borderColor = '#4ca1af'; } };
                choiceBtn.onmouseout = () => { if(!choiceBtn.disabled) { choiceBtn.style.background = 'rgba(255,255,255,0.03)'; choiceBtn.style.borderColor = 'rgba(76, 161, 175, 0.3)'; } };
                
                choicesContainer.appendChild(choiceBtn);
            });

            container.appendChild(questionView);
        },

        handleAnswer(selectedIndex, targetBtn) {
            const question = appState.currentQuiz.questions[appState.currentQuestionIndex];
            const isCorrect = selectedIndex === question.answer;
            
            const buttons = targetBtn.parentElement.querySelectorAll('.choice-btn');
            buttons.forEach(btn => {
                btn.disabled = true;
                btn.style.cursor = 'default';
            });

            if (isCorrect) {
                appState.score++;
                targetBtn.style.background = 'rgba(46, 204, 113, 0.25)';
                targetBtn.style.borderColor = '#2ecc71';
            } else {
                targetBtn.style.background = 'rgba(231, 76, 60, 0.25)';
                targetBtn.style.borderColor = '#e74c3c';
                buttons[question.answer].style.background = 'rgba(46, 204, 113, 0.25)';
                buttons[question.answer].style.borderColor = '#2ecc71';
                buttons[question.answer].style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.3)';
            }

            const feedback = createElement('div', { 
                style: 'margin-top: 35px; padding: 25px; border-radius: 10px; background: rgba(255,255,255,0.04); border-left: 5px solid ' + (isCorrect ? '#2ecc71' : '#e74c3c') + '; animation: slideUp 0.4s ease;'
            },
                createElement('p', { style: 'font-weight: 600; margin-top: 0; font-size: 1.2rem; color: ' + (isCorrect ? '#2ecc71' : '#e74c3c') + ';' }, isCorrect ? '✨ Correct!' : '📍 Correct Answer Below'),
                createElement('p', { style: 'color: #ddd; line-height: 1.5; margin: 15px 0; font-size: 1.05rem;' }, question.explanation),
                createElement('button', {
                    style: 'margin-top: 20px; background: #4ca1af; color: white; border: none; padding: 14px 28px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: transform 0.2s;',
                    onclick: () => this.nextQuestion()
                }, appState.currentQuestionIndex + 1 < appState.currentQuiz.questions.length ? 'Continue' : 'Final Results')
            );
            
            feedback.querySelector('button').onmouseover = (e) => e.target.style.transform = 'scale(1.05)';
            feedback.querySelector('button').onmouseout = (e) => e.target.style.transform = 'scale(1)';

            appState.targetElement.querySelector('#quizzes-content').appendChild(feedback);
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
            const container = appState.targetElement.querySelector('#quizzes-content');
            container.innerHTML = '';

            const percentage = Math.round((appState.score / appState.currentQuiz.questions.length) * 100);
            const status = percentage >= 80 ? 'Master' : (percentage >= 60 ? 'Practitioner' : 'Learner');
            
            const resultsView = createElement('div', { style: 'text-align: center; padding: 50px 20px; animation: fadeIn 0.8s ease;' },
                createElement('div', { style: 'font-size: 5rem; margin-bottom: 25px;' }, percentage >= 80 ? '🏆' : (percentage >= 50 ? '🏅' : '📖')),
                createElement('h3', { style: 'font-size: 2.2rem; color: #4ca1af; margin-bottom: 10px; font-weight: 300;' }, 'Knowledge Check Complete'),
                createElement('p', { style: 'font-size: 1.1rem; color: #888; text-transform: uppercase; letter-spacing: 2px;' }, `Greenhouse Rank: ${status}`),
                createElement('p', { style: 'font-size: 1.6rem; color: #fff; margin: 30px 0; font-weight: 400;' }, `Score: ${appState.score} / ${appState.currentQuiz.questions.length} (${percentage}%)`),
                createElement('div', { style: 'display: flex; gap: 20px; justify-content: center; margin-top: 40px;' },
                    createElement('button', {
                        style: 'background: #4ca1af; color: white; border: none; padding: 14px 30px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem;',
                        onclick: () => this.startQuiz(appState.currentQuiz)
                    }, 'Retake'),
                    createElement('button', {
                        style: 'background: rgba(255,255,255,0.08); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 14px 30px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem;',
                        onclick: () => this.renderQuizList()
                    }, 'Quiz Home')
                )
            );

            container.appendChild(resultsView);
        },

        async init(targetSelector, baseUrl) {
            if (appState.isInitialized) return;
            
            appState.targetSelector = targetSelector;
            appState.baseUrl = baseUrl;
            appState.targetElement = document.querySelector(targetSelector);

            if (!appState.targetElement) {
                console.error(`❌ Target element not found: ${targetSelector}`);
                return;
            }

            const view = this.createView();
            appState.targetElement.appendChild(view);

            // Fetch quizzes (priority: Velo DOM Bridge -> Remote JSON)
            await this.fetchQuizzes();
            this.renderQuizList();

            appState.isInitialized = true;
            console.log("✅ Quizzes app initialized with Data Bridge support");

            // --- Resilience Hook ---
            if (window.GreenhouseUtils && window.GreenhouseUtils.observeAndReinitializeApplication) {
                window.GreenhouseUtils.observeAndReinitializeApplication({
                    name: 'Quizzes',
                    targetSelector: targetSelector,
                    reinitFn: () => {
                        appState.isInitialized = false;
                        this.init(targetSelector, baseUrl);
                    }
                });
            }
        }
    };

    /** ---------------- MAIN ---------------- */
    function main() {
        const scriptElement = document.currentScript;
        const targetSelector = scriptElement?.getAttribute('data-target-selector-left');
        const baseUrl = scriptElement?.getAttribute('data-base-url');

        if (targetSelector && baseUrl) {
            GreenhouseQuizzes.init(targetSelector, baseUrl);
        } else {
            console.warn('Quizzes: Missing attributes, waiting for manual init');
        }
        window.GreenhouseQuizzes = GreenhouseQuizzes;
    }

    // Add required CSS animations
    if (!document.getElementById('greenhouse-quizzes-animations')) {
        const style = document.createElement('style');
        style.id = 'greenhouse-quizzes-animations';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            .choice-btn:disabled { opacity: 0.8; cursor: default; }
            .greenhouse-btn:hover { background: #3a8a9a !important; }
        `;
        document.head.appendChild(style);
    }

    main();

})();

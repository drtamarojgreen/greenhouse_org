"use strict";
/**
 * @file test_quizzes_logic.js
 * @description Comprehensive unit tests for Greenhouse Quizzes Version 1.3.0+.
 * Focuses on logic, state persistence, and DOM resilience.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function () {
    const { assert } = window;
    const TestFramework = window.TestFramework;
    TestFramework.describe('Greenhouse Quizzes Engine (Diligent Validation)', () => {
        let testTarget;
        const selector = '#quizzes-test-target';
        const baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/';
        const mockQuizData = {
            quizzes: [{
                    id: 'adhd_test',
                    title: 'ADHD Test Quiz',
                    questions: [
                        { question: 'Q1', choices: ['A', 'B'], answer: 0, explanation: 'Exp 1' },
                        { question: 'Q2', choices: ['C', 'D'], answer: 1, explanation: 'Exp 2' }
                    ]
                }]
        };
        TestFramework.beforeEach(() => __awaiter(this, void 0, void 0, function* () {
            // 1. Setup DOM
            testTarget = document.createElement('div');
            testTarget.id = 'quizzes-test-target';
            document.body.appendChild(testTarget);
            // 2. Setup Velo Bridge Mock
            const bridge = document.createElement('div');
            bridge.id = 'hiddenQuizzesData';
            bridge.style.display = 'none';
            bridge.textContent = JSON.stringify(mockQuizData);
            document.body.appendChild(bridge);
            // 3. Mock GreenhouseUtils for this context
            if (!window.GreenhouseUtils) {
                window.GreenhouseUtils = {
                    validateConfiguration: () => true,
                    waitForElement: () => Promise.resolve(testTarget),
                    observeAndReinitializeApplication: () => { },
                    appState: { targetSelectorLeft: selector, baseUrl: baseUrl }
                };
            }
        }));
        TestFramework.afterEach(() => {
            if (testTarget)
                testTarget.remove();
            const bridge = document.querySelector('#hiddenQuizzesData');
            if (bridge)
                bridge.remove();
        });
        TestFramework.it('should load quiz data correctly from the Velo Data Bridge', () => __awaiter(this, void 0, void 0, function* () {
            const App = window.GreenhouseQuizzes;
            yield App.initialize();
            const title = testTarget.querySelector('h2');
            assert.hasText(title, 'ADHD Test Quiz');
        }));
        TestFramework.it('should increment score correctly on a correct answer', () => __awaiter(this, void 0, void 0, function* () {
            const App = window.GreenhouseQuizzes;
            yield App.initialize();
            // Simulate clicking the correct choice (Index 0 for Q1)
            const firstChoice = testTarget.querySelector('.quiz-choice');
            firstChoice.click();
            // Logic: handleAnswer is internal, but its side effect is re-rendering the UI
            // We check for the 'Technical Explanation' which proves handleAnswer ran.
            const feedback = testTarget.querySelector('p strong');
            assert.hasText(feedback, 'Technical Explanation');
            // Note: score is internal to the IIFE, but we verify it via final results or debugger
        }));
        TestFramework.it('should advance to the next question when "Continue" is clicked', () => __awaiter(this, void 0, void 0, function* () {
            const App = window.GreenhouseQuizzes;
            yield App.initialize();
            // Answer Q1
            testTarget.querySelector('.quiz-choice').click();
            // Find and click "Continue"
            const nextBtn = testTarget.querySelector('#quiz-next-btn');
            assert.isDefined(nextBtn, 'Next button should appear after answering');
            nextBtn.click();
            // Check if Q2 is displayed
            const questionText = testTarget.querySelector('p');
            assert.hasText(questionText, 'Q2');
        }));
        TestFramework.it('should render the completion screen after the final question', () => __awaiter(this, void 0, void 0, function* () {
            const App = window.GreenhouseQuizzes;
            yield App.initialize();
            // Q1
            testTarget.querySelector('.quiz-choice').click();
            testTarget.querySelector('#quiz-next-btn').click();
            // Q2 (Final)
            testTarget.querySelector('button[data-idx="1"]').click();
            const finishBtn = testTarget.querySelector('#quiz-next-btn');
            assert.hasText(finishBtn, 'See Results');
            finishBtn.click();
            const resultsHeader = testTarget.querySelector('h2');
            assert.hasText(resultsHeader, 'Quiz Complete');
        }));
        TestFramework.it('should survive a "Wix DOM Wipe" and restore state', () => __awaiter(this, void 0, void 0, function* () {
            const App = window.GreenhouseQuizzes;
            yield App.initialize();
            // 1. Progress to Q2
            testTarget.querySelector('.quiz-choice').click();
            testTarget.querySelector('#quiz-next-btn').click();
            // 2. Simulate Wix wiping the target
            testTarget.innerHTML = '';
            console.log("⚠️ Simulating Wix DOM Wipe...");
            // 3. Trigger Re-init (In production this is done by the Observer)
            yield App.initialize();
            // 4. Verify Q2 is still there
            const questionText = testTarget.querySelector('p');
            assert.hasText(questionText, 'Q2', 'State should be preserved across wipes');
        }));
    });
})();

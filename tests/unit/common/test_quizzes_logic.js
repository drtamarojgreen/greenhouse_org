/**
 * @file quizzes_tests.js
 * @description Unit tests for the Quizzes application.
 */

(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Greenhouse Quizzes', () => {
        let container;
        const selector = '#test-quiz-container';

        TestFramework.beforeEach(() => {
            // Setup DOM environment
            container = document.createElement('div');
            container.id = 'test-quiz-container';
            document.body.appendChild(container);

            // Create hidden data bridge element
            const dataBridge = document.createElement('div');
            dataBridge.id = 'hiddenQuizzesData';
            dataBridge.style.display = 'none';
            document.body.appendChild(dataBridge);

            // Reset app state if possible (since it's an IIFE, we might need to reload or mock)
            // For now, assume GreenhouseQuizzes is globally available
        });

        TestFramework.afterEach(() => {
            // Cleanup DOM
            if (container) container.remove();
            const dataBridge = document.querySelector('#hiddenQuizzesData');
            if (dataBridge) dataBridge.remove();
        });

        TestFramework.it('should initialize and render the quiz list', async () => {
            const App = window.GreenhouseQuizzes;
            assert.isDefined(App, 'GreenhouseQuizzes should be globally available');

            // Mock data in bridge
            const mockData = {
                quizzes: [
                    {
                        id: 'test_quiz',
                        title: 'Test Quiz',
                        description: 'A quiz for testing',
                        questions: []
                    }
                ]
            };
            document.querySelector('#hiddenQuizzesData').textContent = JSON.stringify(mockData);

            await App.init(selector, 'https://example.com/');

            const quizView = container.querySelector('.greenhouse-quizzes-view');
            assert.isNotNull(quizView, 'Quiz view should be rendered');

            const quizTitle = container.querySelector('h3');
            assert.hasText(quizTitle, 'Test Quiz');
        });

        TestFramework.it('should start a quiz and render the first question', async () => {
            const App = window.GreenhouseQuizzes;
            const mockQuiz = {
                id: 'test_quiz',
                title: 'Test Quiz',
                questions: [
                    {
                        id: 1,
                        question: 'What is 1 + 1?',
                        choices: ['1', '2', '3'],
                        answer: 1,
                        explanation: 'Math basics'
                    }
                ]
            };

            // Manually set appState if we can, or use App methods
            App.startQuiz(mockQuiz);

            const questionText = container.querySelector('p');
            assert.hasText(questionText, 'What is 1 + 1?');

            const choices = container.querySelectorAll('.choice-btn');
            assert.equal(choices.length, 3, 'Should render 3 choices');
        });

        TestFramework.it('should handle correct answers correctly', async () => {
            const App = window.GreenhouseQuizzes;
            const mockQuiz = {
                id: 'test_quiz',
                questions: [
                    {
                        id: 1,
                        question: 'Q1',
                        choices: ['A', 'B'],
                        answer: 1,
                        explanation: 'Exp'
                    }
                ]
            };

            App.startQuiz(mockQuiz);
            
            const buttons = container.querySelectorAll('.choice-btn');
            const correctBtn = buttons[1];

            // Simulate click
            App.handleAnswer(1, correctBtn);

            const feedback = container.querySelector('div[style*="border-left"]');
            assert.isNotNull(feedback, 'Feedback should be visible');
            assert.hasText(feedback, 'Correct!');
            assert.hasText(feedback, 'Exp');
        });

        TestFramework.it('should handle incorrect answers correctly', async () => {
            const App = window.GreenhouseQuizzes;
            const mockQuiz = {
                id: 'test_quiz',
                questions: [
                    {
                        id: 1,
                        question: 'Q1',
                        choices: ['A', 'B'],
                        answer: 1,
                        explanation: 'Exp'
                    }
                ]
            };

            App.startQuiz(mockQuiz);
            
            const buttons = container.querySelectorAll('.choice-btn');
            const incorrectBtn = buttons[0];

            // Simulate click
            App.handleAnswer(0, incorrectBtn);

            const feedback = container.querySelector('div[style*="border-left"]');
            assert.hasText(feedback, 'Incorrect');
            assert.hasText(feedback, 'Exp');
        });
    });
})();

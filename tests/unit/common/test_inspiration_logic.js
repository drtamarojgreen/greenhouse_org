"use strict";
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
    TestFramework.describe('Greenhouse Inspiration (Unit)', () => {
        const Inspiration = window.GreenhouseInspiration;
        TestFramework.it('should initialize and export public API', () => {
            assert.isDefined(Inspiration);
            assert.isFunction(Inspiration.getState);
        });
        TestFramework.describe('UI Component Generation', () => {
            TestFramework.it('should handle reinitialization', () => __awaiter(this, void 0, void 0, function* () {
                yield Inspiration.reinitialize();
                const state = Inspiration.getState();
                assert.isFalse(state.isLoading);
            }));
        });
        TestFramework.describe('Notification Logic', () => {
            TestFramework.it('should proxy notifications to GreenhouseUtils', () => {
                const originalUtils = window.GreenhouseUtils;
                let lastSuccess, lastError;
                window.GreenhouseUtils = {
                    displaySuccess: (msg) => { lastSuccess = msg; },
                    displayError: (msg) => { lastError = msg; }
                };
                Inspiration.showNotification('Success!', 'success');
                assert.equal(lastSuccess, 'Success!');
                Inspiration.showNotification('Error!', 'error');
                assert.equal(lastError, 'Error!');
                window.GreenhouseUtils = originalUtils;
            });
        });
    });
})();

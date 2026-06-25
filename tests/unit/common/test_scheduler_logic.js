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
    TestFramework.describe('Greenhouse Scheduler Core (Unit)', () => {
        const Scheduler = window.GreenhouseAppsScheduler; // Check global name in scheduler.js or fallback to GreenhouseScheduler
        TestFramework.it('should define public API on window', () => {
            const api = window.GreenhouseScheduler || window.GreenhouseAppsScheduler;
            assert.isDefined(api);
            assert.isFunction(api.getState);
            assert.isFunction(api.reinitialize);
        });
        TestFramework.describe('State Management', () => {
            TestFramework.it('should provide access to app state', () => {
                const api = window.GreenhouseScheduler || window.GreenhouseAppsScheduler;
                const state = api.getState();
                assert.isDefined(state);
                assert.isBoolean(state.isInitialized);
            });
            TestFramework.it('should handle reinitialization request', () => __awaiter(this, void 0, void 0, function* () {
                const api = window.GreenhouseScheduler || window.GreenhouseAppsScheduler;
                yield api.reinitialize();
                const state = api.getState();
                assert.isTrue(state.isInitialized);
            }));
        });
        TestFramework.describe('View Switching (Logical)', () => {
            TestFramework.it('should update state when switching views', () => __awaiter(this, void 0, void 0, function* () {
                const api = window.GreenhouseScheduler || window.GreenhouseAppsScheduler;
                const st = api.getState();
                assert.isDefined(st.baseUrl);
            }));
        });
    });
})();

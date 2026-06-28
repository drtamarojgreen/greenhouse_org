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
    TestFramework.describe('GreenhousePatientApp (Unit)', () => {
        const App = window.GreenhousePatientApp;
        TestFramework.describe('Core API', () => {
            TestFramework.it('should be defined on global window', () => {
                assert.isDefined(App);
                assert.isFunction(App.init);
            });
        });
        TestFramework.describe('UI Population Helpers', () => {
            TestFramework.it('populateServices should handle empty API response', () => __awaiter(this, void 0, void 0, function* () {
                const originalFetch = window.fetch;
                window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
                yield App.populateServices();
                window.fetch = originalFetch;
            }));
            TestFramework.it('populateAppointments should create list items', () => __awaiter(this, void 0, void 0, function* () {
                const originalFetch = window.fetch;
                window.fetch = () => Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve([{ _id: '1', title: 'Test', date: '2024-01-01', time: '10:00', platform: 'Zoom' }])
                });
                yield App.populateAppointments();
                window.fetch = originalFetch;
            }));
        });
        TestFramework.describe('Conflict Management', () => {
            TestFramework.it('showConflictModal should not crash with null data', () => {
                App.showConflictModal(null);
            });
        });
    });
})();

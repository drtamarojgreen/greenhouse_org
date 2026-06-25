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
    TestFramework.describe('GreenhouseReactCompatibility (Unit - Firefox Mock)', () => {
        const RC = window.GreenhouseReactCompatibility;
        TestFramework.it('should detect Firefox from user agent', () => {
            assert.isTrue(RC.isFirefox);
        });
        TestFramework.it('detectReact should check global window.React', () => {
            const originalReact = window.React;
            window.React = { version: '18.2.0' };
            assert.isTrue(RC.detectReact());
            assert.equal(RC.reactVersion, '18.2.0');
            window.React = originalReact;
        });
        TestFramework.describe('Element LifeCycle Safety', () => {
            TestFramework.it('createElementSafely should mark elements with greenhouse tag', () => {
                const el = RC.createElementSafely('div', { id: 'test' });
                assert.equal(el.id, 'test');
                assert.equal(el.getAttribute('data-greenhouse-created'), 'true');
            });
            TestFramework.it('removeElementSafely should handle non-React elements normally', () => __awaiter(this, void 0, void 0, function* () {
                let removed = false;
                const mockEl = { parentNode: { removeChild: () => { removed = true; } } };
                yield RC.removeElementSafely(mockEl);
                assert.isTrue(removed);
            }));
            TestFramework.it('removeElementSafely should refuse to remove React-managed elements', () => __awaiter(this, void 0, void 0, function* () {
                const mockEl = {
                    parentNode: { removeChild: () => { } },
                    _reactInternalFiber: {}
                };
                const result = yield RC.removeElementSafely(mockEl);
                assert.isFalse(result);
            }));
        });
        TestFramework.describe('Status Reporting', () => {
            TestFramework.it('getStatus should provide comprehensive diagnostic object', () => {
                const status = RC.getStatus();
                assert.isTrue(status.isFirefox);
                assert.isDefined(status.reactDetected);
            });
        });
    });
})();

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
    TestFramework.describe('Mobile Models Lifecycle Tests', () => {
        TestFramework.it('should prevent duplicate hub rendering', () => __awaiter(this, void 0, void 0, function* () {
            const models = [{ id: 'genetic', title: 'Genetic', url: '/genetic' }];
            if (window.GreenhouseMobile && window.GreenhouseMobile.renderHub) {
                window.GreenhouseMobile.renderHub(models);
                const firstCount = document.body.children.length;
                window.GreenhouseMobile.renderHub(models);
                const secondCount = document.body.children.length;
                assert.equal(firstCount, secondCount);
            }
        }));
        TestFramework.it('should track active models correctly', () => __awaiter(this, void 0, void 0, function* () {
            if (window.GreenhouseMobile && window.GreenhouseMobile.activateModel) {
                const container = document.createElement('div');
                window.GreenhouseMobile.modelRegistry.test = { scripts: [], init: () => { } };
                yield window.GreenhouseMobile.activateModel('test', container);
                assert.isTrue(window.GreenhouseMobile.activeModels.has(container));
            }
        }));
    });
})();

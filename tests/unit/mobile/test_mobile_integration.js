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
    TestFramework.describe('Mobile Integration Tests', () => {
        TestFramework.describe('Mobile Detection', () => {
            TestFramework.it('should return boolean from isMobileUser', () => {
                const isMobile = window.GreenhouseUtils.isMobileUser();
                assert.isType(isMobile, 'boolean');
            });
        });
        TestFramework.describe('Model Registry', () => {
            TestFramework.it('should have models registered', () => {
                if (window.GreenhouseMobile && window.GreenhouseMobile.modelRegistry) {
                    assert.isTrue(Object.keys(window.GreenhouseMobile.modelRegistry).length > 0);
                }
            });
        });
        TestFramework.describe('Resilient Data Fetching', () => {
            TestFramework.it('should return models array from fetchModelDescriptions', () => __awaiter(this, void 0, void 0, function* () {
                const models = yield window.GreenhouseUtils.fetchModelDescriptions();
                assert.isArray(models);
                assert.greaterThan(models.length, 0);
            }));
        });
    });
})();

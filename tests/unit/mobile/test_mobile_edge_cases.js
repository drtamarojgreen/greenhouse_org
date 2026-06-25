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
    TestFramework.describe('Mobile Edge Cases and Error Handling', () => {
        TestFramework.describe('Boundary Conditions', () => {
            TestFramework.it('should return boolean from isMobileUser', () => {
                const isMobile = window.GreenhouseUtils.isMobileUser();
                assert.isType(isMobile, 'boolean');
            });
        });
        TestFramework.describe('Invalid Input Handling', () => {
            TestFramework.it('should handle missing modelId in activateModel', () => __awaiter(this, void 0, void 0, function* () {
                if (window.GreenhouseMobile && window.GreenhouseMobile.activateModel) {
                    yield window.GreenhouseMobile.activateModel(undefined, null);
                }
                assert.isTrue(true);
            }));
        });
    });
})();

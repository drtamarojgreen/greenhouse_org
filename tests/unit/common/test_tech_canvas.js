(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Tech Page Canvas Mobile Detection', () => {

        TestFramework.it('should draw "Mobile Browser Detected" on canvas when isMobileUser is true', async () => {
            // Setup Mobile Environment
            const originalInnerWidth = window.innerWidth;
            const originalMaxTouchPoints = navigator.maxTouchPoints;
            const originalUserAgent = navigator.userAgent;

            // We can't easily mock navigator properties directly if they are read-only
            // but GreenhouseUtils.isMobileUser() is what matters.
            const originalIsMobile = window.GreenhouseUtils.isMobileUser;
            window.GreenhouseUtils.isMobileUser = () => true;

            let messageDetected = false;

            // Instrument document.createElement to catch the canvas
            const originalCreateElement = document.createElement;
            document.createElement = function(tag) {
                const el = originalCreateElement.call(document, tag);
                if (tag === 'canvas') {
                    const originalGetContext = el.getContext;
                    el.getContext = function(type) {
                        const ctx = originalGetContext.call(el, type);
                        if (ctx) {
                            const originalFillText = ctx.fillText;
                            ctx.fillText = function(text, x, y) {
                                if (text === 'Mobile Browser Detected') {
                                    messageDetected = true;
                                }
                                return originalFillText.call(ctx, text, x, y);
                            };
                        }
                        return ctx;
                    };
                }
                return el;
            };

            // Execute TechApp logic if available
            if (window.TechApp && window.TechApp.init) {
                const container = document.createElement('div');
                await window.TechApp.init(container);
            }

            assert.isTrue(messageDetected, 'Canvas should have drawn "Mobile Browser Detected"');

            // Cleanup
            document.createElement = originalCreateElement;
            window.GreenhouseUtils.isMobileUser = originalIsMobile;
        });

        TestFramework.it('should NOT draw mobile message when isMobileUser is false', async () => {
            const originalIsMobile = window.GreenhouseUtils.isMobileUser;
            window.GreenhouseUtils.isMobileUser = () => false;

            let messageDetected = false;

            const originalCreateElement = document.createElement;
            document.createElement = function(tag) {
                const el = originalCreateElement.call(document, tag);
                if (tag === 'canvas') {
                    const originalGetContext = el.getContext;
                    el.getContext = function(type) {
                        const ctx = originalGetContext.call(el, type);
                        if (ctx) {
                            const originalFillText = ctx.fillText;
                            ctx.fillText = function(text, x, y) {
                                if (text === 'Mobile Browser Detected') {
                                    messageDetected = true;
                                }
                                return originalFillText.call(ctx, text, x, y);
                            };
                        }
                        return ctx;
                    };
                }
                return el;
            };

            if (window.TechApp && window.TechApp.init) {
                const container = document.createElement('div');
                await window.TechApp.init(container);
            }

            assert.isFalse(messageDetected, 'Canvas should NOT have drawn mobile message on desktop');

            document.createElement = originalCreateElement;
            window.GreenhouseUtils.isMobileUser = originalIsMobile;
        });
    });
})();

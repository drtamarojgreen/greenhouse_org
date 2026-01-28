/**
 * Lightweight Sinon-like Mock Utility
 */

const SinonMock = {
    spy: function(obj, method) {
        if (obj && method) {
            const original = obj[method];
            const spyFn = SinonMock.spy();
            spyFn.implementation = original.bind(obj);
            obj[method] = spyFn;
            spyFn.restore = () => { obj[method] = original; };
            return spyFn;
        }
        const spyFn = function(...args) {
            spyFn.called = true;
            spyFn.calledOnce = true;
            spyFn.callCount++;
            spyFn.args.push(args);
            spyFn.lastCall = { args: args };
            if (spyFn.implementation) {
                return spyFn.implementation(...args);
            }
        };
        spyFn.called = false;
        spyFn.calledOnce = false;
        spyFn.callCount = 0;
        spyFn.args = [];
        spyFn.calledWith = (...expectedArgs) => {
            return spyFn.args.some(actualArgs =>
                expectedArgs.every((arg, i) => arg === actualArgs[i])
            );
        };
        return spyFn;
    },

    stub: function(obj, method) {
        const original = obj && method ? obj[method] : null;
        const stubFn = SinonMock.spy();

        stubFn.returns = (val) => {
            stubFn.implementation = () => val;
            return stubFn;
        };

        stubFn.withArgs = (...args) => {
            // Simplified withArgs
            return stubFn;
        };

        stubFn.restore = () => {
            if (obj && method) obj[method] = original;
        };

        if (obj && method) obj[method] = stubFn;
        return stubFn;
    },

    restore: function() {
        // Global restore would need to track all stubs
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SinonMock;
}

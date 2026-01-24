/**
 * Minimal Sinon Mock
 *
 * Provides a subset of Sinon.js functionality (spies and stubs)
 * for testing without external dependencies.
 */

const sinonMock = {
    _stubs: new Set(),

    spy: function(fn) {
        const spy = function(...args) {
            spy.called = true;
            spy.calledOnce = true;
            spy.calls.push(args);
            spy.callCount++;
            if (fn) return fn(...args);
            return spy.returnsValue;
        };
        spy.called = false;
        spy.calledOnce = false;
        spy.calls = [];
        spy.callCount = 0;
        spy.returnsValue = undefined;
        spy.calledWith = (...expectedArgs) => {
            return spy.calls.some(callArgs =>
                expectedArgs.every((arg, i) => callArgs[i] === arg)
            );
        };
        return spy;
    },

    stub: function(obj, method) {
        const original = obj && method ? obj[method] : null;
        const stub = this.spy();

        stub.returns = (val) => { stub.returnsValue = val; return stub; };
        stub.withArgs = () => stub;
        stub.restore = () => {
            if (obj && method) obj[method] = original;
            this._stubs.delete(stub);
        };

        if (obj && method) {
            obj[method] = stub;
        }

        this._stubs.add(stub);
        return stub;
    },

    restore: function() {
        this._stubs.forEach(stub => {
            if (stub.restore) stub.restore();
        });
        this._stubs.clear();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = sinonMock;
}

if (typeof window !== 'undefined') {
    window.sinon = sinonMock;
}

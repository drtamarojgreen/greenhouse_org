(function() {
    const { assert } = window;
    const TestFramework = window.TestFramework;

    TestFramework.describe('Serotonin Transport Logic (Unit)', () => {

        const T = window.GreenhouseSerotonin.Transport;

        TestFramework.beforeEach(() => {
            T.tryptophan = 100;
            T.htp5 = 0;
            T.vesicle5HT = 0;
            T.sertAllele = 'Long';
        });

        TestFramework.describe('Synthesis Pathway', () => {
            TestFramework.it('should convert Tryptophan to 5-HTP (step 1)', () => {
                T.updateTransport();
                assert.lessThan(T.tryptophan, 100);
                assert.greaterThan(T.htp5, 0);
            });

            TestFramework.it('should convert 5-HTP to vesicle 5-HT (step 2)', () => {
                T.htp5 = 10;
                T.updateTransport();
                assert.lessThan(T.htp5, 10);
                assert.greaterThan(T.vesicle5HT, 0);
            });
        });

        TestFramework.describe('Melatonin Conversion', () => {
            TestFramework.it('Pineal mode should generate melatonin from 5-HT', () => {
                T.pinealMode = true;
                T.vesicle5HT = 10;
                T.updateTransport();
                assert.greaterThan(T.melatonin, 0);
            });
        });

    });
})();

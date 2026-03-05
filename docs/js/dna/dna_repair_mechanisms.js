// docs/js/dna_repair_mechanisms.js
// DNA Repair Simulation Module - Repair Pathways
// Implements specific biological repair mechanisms

(function () {
    'use strict';

    window.GreenhouseDNARepair = window.GreenhouseDNARepair || {};
    const G = window.GreenhouseDNARepair;

    G.handleBER = function(t) {
        const targetIdx = Math.floor(this.config.helixLength / 2);
        const pair = this.state.basePairs[targetIdx];
        if (!pair) return;

        if (t === 10) {
            // Induce damage if none exists, or use existing deamination
            if (!pair.isDamaged) {
                pair.isDamaged = true;
                pair.damageType = 'ROS';
            }
            this.consumeATP(2, pair.x, 0, 0);
        }

        // Recognition by Glycosylase
        if (t === 100) {
            this.spawnParticles(pair.x, 0, 0, 20, '#ff00ff');
            this.consumeATP(10, pair.x, 0, 0);
        }

        // Removal of damaged base (creating AP site)
        if (t > 150 && t < 300) {
            pair.base1 = '';
            if (t % 10 === 0) this.consumeATP(1, pair.x, 0, 0);
        }

        // Polymerase and Ligase restore the base
        if (t === 300) {
            this.spawnParticles(pair.x, 0, 0, 10, this.config.colors.A);
            this.consumeATP(20, pair.x, 0, 0);
        }

        if (t === 350) {
            // Restore based on complementary base
            if (pair.base2 === 'G') pair.base1 = 'C';
            else if (pair.base2 === 'C') pair.base1 = 'G';
            else if (pair.base2 === 'T') pair.base1 = 'A';
            else if (pair.base2 === 'A') pair.base1 = 'T';
            else pair.base1 = 'A';

            pair.isDamaged = false;
            pair.damageType = null;
            this.state.successfulRepairs++;
        }
    };

    G.handleMMR = function(t) {
        const targetIdx = Math.floor(this.config.helixLength / 2) + 5;
        const pair = this.state.basePairs[targetIdx];
        if (!pair) return;

        if (t === 10) {
            pair.base1 = 'C'; pair.base2 = 'C'; pair.isDamaged = true;
            pair.damageType = 'Mismatch';
            this.consumeATP(5, pair.x, 0, 0);
        }
        if (t > 150 && t < 400) {
            // Excision of a patch
            for (let i = -2; i <= 2; i++) {
                if (this.state.basePairs[targetIdx + i])
                    this.state.basePairs[targetIdx + i].base1 = '';
            }
            if (t % 10 === 0) this.consumeATP(2, pair.x, 0, 0);
        }
        if (t === 450) {
            for (let i = -2; i <= 2; i++) {
                const p = this.state.basePairs[targetIdx + i];
                if (p) {
                    // Restoration
                    if (p.base2 === 'G') p.base1 = 'C';
                    else if (p.base2 === 'C') p.base1 = 'G';
                    else if (p.base2 === 'T') p.base1 = 'A';
                    else if (p.base2 === 'A') p.base1 = 'T';
                    p.isDamaged = false;
                    p.damageType = null;
                }
            }
            this.consumeATP(40, pair.x, 0, 0);
            this.state.successfulRepairs++;
        }
    };

    G.handleNER = function(t) {
        const targetIdx = Math.floor(this.config.helixLength / 2) - 5;
        const lesionSize = 4;
        const anchor = this.state.basePairs[targetIdx + 2];
        if (!anchor) return;

        if (t === 10) {
            for (let i = 0; i < lesionSize; i++) {
                const p = this.state.basePairs[targetIdx + i];
                if (p) { p.isDamaged = true; p.damageType = 'UV'; }
            }
            this.consumeATP(8, anchor.x, 0, 0);
        }
        if (t === 100) {
            this.spawnParticles(anchor.x, 0, 0, 30, '#00ff00');
            this.consumeATP(15, anchor.x, 0, 0);
        }
        if (t > 100 && t < 150) {
            this.state.globalHelixUnwind += 0.02;
        }
        if (t > 150 && t < 350) {
            for (let i = 0; i < lesionSize; i++) {
                const p = this.state.basePairs[targetIdx + i];
                if (p) p.base1 = '';
            }
            if (t % 10 === 0) this.consumeATP(3, anchor.x, 0, 0);
        }
        if (t > 350 && t < 400) {
            this.state.globalHelixUnwind -= 0.02;
        }
        if (t === 400) {
            this.spawnParticles(anchor.x, 0, 0, 20, '#00D9FF');
            this.consumeATP(30, anchor.x, 0, 0);
            this.state.globalHelixUnwind = 0;
        }
        if (t === 450) {
            for (let i = 0; i < lesionSize; i++) {
                const p = this.state.basePairs[targetIdx + i];
                if (p) {
                    if (p.base2 === 'G') p.base1 = 'C';
                    else if (p.base2 === 'C') p.base1 = 'G';
                    else if (p.base2 === 'T') p.base1 = 'A';
                    else if (p.base2 === 'A') p.base1 = 'T';
                    p.isDamaged = false;
                    p.damageType = null;
                }
            }
            this.state.successfulRepairs++;
        }
    };

    G.handleNHEJ = function(t) {
        const targetIdx = Math.floor(this.config.helixLength / 2);
        const pair = this.state.basePairs[targetIdx];
        if (!pair) return;

        if (t === 50) {
            pair.isBroken = true;
            this.consumeATP(10, pair.x, 0, 0);
        }
        if (t > 50 && t < 150) {
            this.state.basePairs.forEach(p => {
                if (p.index < targetIdx) { p.x -= 0.1; }
                if (p.index > targetIdx) { p.x += 0.1; }
            });
        }
        if (t === 200) {
            this.consumeATP(20, pair.x, 0, 0);
            this.spawnParticles(pair.x, 0, 0, 30, '#ff5500');
            this.state.basePairs.splice(targetIdx, 1);
            this.state.mutationCount++;
            this.state.mutatedRepairs++;
            this.state.genomicIntegrity -= 5;
            this.state.basePairs.forEach(p => { p.isBroken = false; });
        }
    };

    G.handleDSB = function(t) {
        const targetIdx = Math.floor(this.config.helixLength / 2);
        const pair = this.state.basePairs[targetIdx];
        if (!pair) return;

        if (t === 50) {
            pair.isBroken = true;
            this.consumeATP(5, pair.x, 0, 0);
        }
        if (t > 50 && t < 300) {
            this.state.basePairs.forEach(p => {
                if (p.index < targetIdx) { p.x -= 0.2; p.offsetY -= 0.1; }
                if (p.index > targetIdx) { p.x += 0.2; p.offsetY += 0.1; }
            });
        }
        if (t === 350) {
            this.spawnParticles(pair.x, 0, 0, 50, '#ffff00');
            this.consumeATP(50, pair.x, 0, 0);
        }
        if (t > 400) {
            this.state.basePairs.forEach((p, i) => {
                const targetX = (i - this.config.helixLength / 2) * this.config.rise;
                p.x += (targetX - p.x) * 0.05;
                p.offsetY += (0 - p.offsetY) * 0.05;
            });
            if (Math.abs(pair.x - ((targetIdx - this.config.helixLength / 2) * this.config.rise)) < 1) {
                pair.isBroken = false;
            }
        }
    };

    G.handleHR = function(t) {
        const targetIdx = Math.floor(this.config.helixLength / 2);
        const pair = this.state.basePairs[targetIdx];
        if (!pair) return;

        if (t === 50) {
            pair.isBroken = true;
            this.consumeATP(10, pair.x, 0, 0);
        }
        if (t > 60 && t < 150) {
            this.state.globalHelixUnwind += 0.01;
            const range = Math.floor((t - 60) / 10);
            for (let i = -range; i <= range; i++) {
                const p = this.state.basePairs[targetIdx + i];
                if (p) { p.base1 = ''; if (t % 10 === 0) this.consumeATP(1, p.x, 0, 0); }
            }
        }
        if (t > 150 && t < 450) {
            if (t % 5 === 0) { this.spawnParticles(pair.x + (Math.random() - 0.5) * 200, 100, 0, 2, '#667eea'); }
        }
        if (t > 200 && t < 400) {
            if (t % 20 === 0) { this.consumeATP(5, pair.x, 50, 0); this.spawnParticles(pair.x, 50, 0, 10, '#00FF66'); }
        }
        if (t === 450) {
            this.consumeATP(30, pair.x, 0, 0);
            this.state.globalHelixUnwind = 0;
            this.generateDNA();
            pair.isBroken = false;
            pair.damageType = null;
            this.state.successfulRepairs++;
        }
    };

    G.handlePhotolyase = function(t) {
        const targetIdx = Math.floor(this.config.helixLength / 2) - 10;
        const pair = this.state.basePairs[targetIdx];
        if (!pair) return;

        if (t === 10) {
            pair.isDamaged = true;
            pair.damageType = 'UV';
            this.consumeATP(2, pair.x, 0, 0);
        }
        if (t === 100) {
            this.spawnParticles(pair.x, 0, 0, 20, '#9d00ff');
            this.consumeATP(5, pair.x, 0, 0);
        }
        if (t === 200) {
            this.spawnParticles(pair.x, 0, 0, 60, '#00fbff');
            pair.isDamaged = false;
            pair.damageType = null;
            this.state.successfulRepairs++;
        }
    };

    G.handleMGMT = function(t) {
        const targetIdx = Math.floor(this.config.helixLength / 2) + 10;
        const pair = this.state.basePairs[targetIdx];
        if (!pair) return;

        if (t === 10) {
            pair.isDamaged = true;
            pair.damageType = 'Alkylation';
            this.consumeATP(2, pair.x, 0, 0);
        }

        if (t === 100) {
            this.spawnParticles(pair.x, 0, 0, 25, '#ff00aa');
            this.consumeATP(5, pair.x, 0, 0);
        }

        if (t === 200) {
            this.spawnParticles(pair.x, 0, 0, 40, '#ffaa00');
            pair.isDamaged = false;
            pair.damageType = null;
            this.state.successfulRepairs++;
            this.spawnParticles(pair.x, -50, 0, 10, '#ffffff');
        }
    };
})();

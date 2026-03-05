/**
 * @file rna_repair_enzymes.js
 * @description Advanced enzyme definitions and factory for RNA repair simulation.
 */

(function () {
    'use strict';

    window.Greenhouse = window.Greenhouse || {};

    /**
     * @class BaseEnzyme
     */
    class BaseEnzyme {
        constructor(name, targetIndex, x, y, speed = 3) {
            this.name = name;
            this.targetIndex = targetIndex;
            this.x = x;
            this.y = y;
            this.size = 40;
            this.speed = speed;
            this.state = 'approaching';
            this.progress = 0;
            this.costPerTick = 0.1;
        }

        update(dt, targetBase, atpManager) {
            if (!targetBase) return;

            if (this.state === 'approaching') {
                const dx = targetBase.x - this.x;
                const dy = targetBase.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 5) {
                    this.state = 'repairing';
                } else {
                    this.x += (dx / dist) * this.speed * (dt / 16);
                    this.y += (dy / dist) * this.speed * (dt / 16);
                }
            } else if (this.state === 'repairing') {
                this.x = targetBase.x;
                this.y = targetBase.y;

                const atpFactor = atpManager ? atpManager.getKineticsFactor() : 1.0;
                const kinetics = 0.01 * atpFactor * (dt / 16);

                if (atpManager) {
                    if (atpManager.consume(this.costPerTick * (dt / 16))) {
                        this.progress += kinetics;
                    } else {
                        // Stall if no ATP
                        this.progress += kinetics * 0.1;
                    }
                } else {
                    this.progress += kinetics;
                }

                if (this.progress >= 1) {
                    this.complete(targetBase);
                    this.state = 'leaving';
                }
            } else if (this.state === 'leaving') {
                this.y -= this.speed * (dt / 16);
                this.size *= 0.98;
            }
        }

        complete(targetBase) {
            // Virtual
        }
    }

    class Ligase extends BaseEnzyme {
        constructor(targetIndex, x, y) {
            super('Ligase', targetIndex, x, y);
        }
        complete(targetBase) {
            targetBase.connected = true;
            targetBase.flash = 1.0;
        }
    }

    class Demethylase extends BaseEnzyme {
        constructor(targetIndex, x, y) {
            super('Demethylase', targetIndex, x, y);
        }
        complete(targetBase) {
            targetBase.damaged = false;
            targetBase.damageType = null;
            targetBase.flash = 1.0;
        }
    }

    /**
     * Enhancement 1: AlkB-mediated Demethylation
     */
    class AlkB extends BaseEnzyme {
        constructor(targetIndex, x, y) {
            super('AlkB', targetIndex, x, y, 4);
            this.costPerTick = 0.15;
        }
        complete(targetBase) {
            targetBase.damaged = false;
            targetBase.damageType = null;
            targetBase.flash = 1.2;
        }
    }

    /**
     * Enhancement 2: RtcB Ligation
     */
    class RtcB extends BaseEnzyme {
        constructor(targetIndex, x, y) {
            super('RtcB', targetIndex, x, y, 3.5);
            this.costPerTick = 0.2;
        }
        complete(targetBase) {
            targetBase.connected = true;
            targetBase.flash = 1.5;
        }
    }

    /**
     * @class RNAEnzymeFactory
     */
    class RNAEnzymeFactory {
        static create(name, targetIndex, x, y) {
            switch (name) {
                case 'Ligase': return new Ligase(targetIndex, x, y);
                case 'Demethylase': return new Demethylase(targetIndex, x, y);
                case 'AlkB': return new AlkB(targetIndex, x, y);
                case 'RtcB': return new RtcB(targetIndex, x, y);
                default: return new BaseEnzyme(name, targetIndex, x, y);
            }
        }
    }

    window.Greenhouse.RNAEnzymeFactory = RNAEnzymeFactory;
    window.Greenhouse.RNABaseEnzyme = BaseEnzyme;
    console.log("RNA Enzymes module loaded.");
})();

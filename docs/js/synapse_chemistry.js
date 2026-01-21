// docs/js/synapse_chemistry.js

(function () {
    'use strict';

    const G = window.GreenhouseSynapseApp || {};
    window.GreenhouseSynapseApp = G;

    G.Chemistry = {
        neurotransmitters: {
            glutamate: {
                id: 'glutamate',
                name: { en: 'Glutamate', es: 'Glutamato' },
                type: 'excitatory',
                color: '#FF8C00', // Dark Orange
                glow: 'rgba(255, 140, 0, 0.6)',
                targets: ['ionotropic_receptor'],
                ionEffect: 'sodium'
            },
            gaba: {
                id: 'gaba',
                name: { en: 'GABA', es: 'GABA' },
                type: 'inhibitory',
                color: '#32CD32', // Lime Green
                glow: 'rgba(50, 205, 50, 0.6)',
                targets: ['ionotropic_receptor'],
                ionEffect: 'chloride'
            },
            dopamine: {
                id: 'dopamine',
                name: { en: 'Dopamine', es: 'Dopamina' },
                type: 'modulatory',
                color: '#FF1493', // Deep Pink
                glow: 'rgba(255, 20, 147, 0.6)',
                targets: ['gpcr'],
                ionEffect: 'none'
            },
            serotonin: {
                id: 'serotonin',
                name: { en: 'Serotonin', es: 'Serotonina' },
                type: 'modulatory',
                color: '#00F2FF', // Electric Cyan
                glow: 'rgba(0, 242, 255, 0.6)',
                targets: ['gpcr'],
                ionEffect: 'none'
            }
        },

        receptors: {
            ionotropic_receptor: {
                id: 'ionotropic_receptor',
                name: { en: 'Ionotropic Receptor', es: 'Receptor Ionotrópico' },
                binds: ['glutamate', 'gaba']
            },
            gpcr: {
                id: 'gpcr',
                name: { en: 'GPCR', es: 'Receptor acoplado a proteína G' },
                binds: ['serotonin', 'dopamine']
            }
        },

        ions: {
            sodium: {
                id: 'sodium',
                name: { en: 'Sodium (Na+)', es: 'Sodio (Na+)' },
                charge: '+',
                color: '#ffd700', // Gold
                effect: 'depolarize'
            },
            chloride: {
                id: 'chloride',
                name: { en: 'Chloride (Cl-)', es: 'Cloro (Cl-)' },
                charge: '-',
                color: '#adff2f', // Greenish Yellow
                effect: 'hyperpolarize'
            },
            calcium: {
                id: 'calcium',
                name: { en: 'Calcium (Ca2+)', es: 'Calcio (Ca2+)' },
                charge: '++',
                color: '#ffffff', // White
                effect: 'plasticity'
            }
        }
    };
})();

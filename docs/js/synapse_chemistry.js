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
                ionEffect: 'sodium',
                reuptakeVia: 'EAAT',
                enzyme: null
            },
            gaba: {
                id: 'gaba',
                name: { en: 'GABA', es: 'GABA' },
                type: 'inhibitory',
                color: '#32CD32', // Lime Green
                glow: 'rgba(50, 205, 50, 0.6)',
                targets: ['ionotropic_receptor'],
                ionEffect: 'chloride',
                reuptakeVia: 'GAT',
                enzyme: null
            },
            dopamine: {
                id: 'dopamine',
                name: { en: 'Dopamine', es: 'Dopamina' },
                type: 'modulatory',
                color: '#FF1493', // Deep Pink
                glow: 'rgba(255, 20, 147, 0.6)',
                targets: ['gpcr'],
                ionEffect: 'none',
                reuptakeVia: 'DAT',
                enzyme: 'COMT'
            },
            serotonin: {
                id: 'serotonin',
                name: { en: 'Serotonin', es: 'Serotonina' },
                type: 'modulatory',
                color: '#00F2FF', // Electric Cyan
                glow: 'rgba(0, 242, 255, 0.6)',
                targets: ['gpcr'],
                ionEffect: 'none',
                reuptakeVia: 'SERT',
                enzyme: 'MAO'
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
            },
            autoreceptor: {
                id: 'autoreceptor',
                name: { en: 'Auto-receptor', es: 'Auto-receptor' },
                binds: ['serotonin', 'dopamine', 'glutamate', 'gaba']
            }
        },

        transporters: {
            EAAT: { name: 'Excitatory Amino Acid Transporter', targets: ['glutamate'] },
            GAT: { name: 'GABA Transporter', targets: ['gaba'] },
            SERT: { name: 'Serotonin Transporter', targets: ['serotonin'] },
            DAT: { name: 'Dopamine Transporter', targets: ['dopamine'] }
        },

        enzymes: {
            MAO: { name: 'Monoamine Oxidase', targets: ['serotonin', 'dopamine'], rate: 0.01 },
            COMT: { name: 'Catechol-O-methyltransferase', targets: ['dopamine'], rate: 0.008 },
            AChE: { name: 'Acetylcholinesterase', targets: ['acetylcholine'], rate: 0.1 }
        },

        drugs: {
            ssri: { name: 'SSRI', targetTransporter: 'SERT', effect: 'block_reuptake' },
            antagonist: { name: 'Antagonist', targetReceptor: 'ionotropic_receptor', effect: 'block_binding' },
            agonist: { name: 'Agonist', targetReceptor: 'gpcr', effect: 'activate' }
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

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
                enzyme: null,
                molecularWeight: '147.13 g/mol',
                pKa: 2.1
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
                enzyme: null,
                molecularWeight: '103.12 g/mol',
                pKa: 4.2
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
                enzyme: 'COMT',
                molecularWeight: '153.18 g/mol',
                pKa: 8.9
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
                enzyme: 'MAO',
                molecularWeight: '176.21 g/mol',
                pKa: 9.5
            }
        },

        receptors: {
            ionotropic_receptor: {
                id: 'ionotropic_receptor',
                name: { en: 'Ionotropic Receptor', es: 'Receptor Ionotrópico' },
                binds: ['glutamate', 'gaba'],
                stoichiometry: 'Pentameric (α2βγδ)',
                pdbId: '6X3Z'
            },
            gpcr: {
                id: 'gpcr',
                name: { en: 'GPCR', es: 'Receptor acoplado a proteína G' },
                binds: ['serotonin', 'dopamine'],
                stoichiometry: 'Monomeric / Heterodimeric',
                pdbId: '7E2X'
            },
            autoreceptor: {
                id: 'autoreceptor',
                name: { en: 'Auto-receptor', es: 'Auto-receptor' },
                binds: ['serotonin', 'dopamine', 'glutamate', 'gaba'],
                stoichiometry: 'Monomeric',
                pdbId: '6VMS'
            }
        },

        scenarios: {
            healthy: {
                id: 'healthy',
                name: { en: 'Healthy State', es: 'Estado Saludable' },
                description: 'Normal synaptic density and neurotransmitter kinetics.',
                modifiers: { receptorDensity: 1.0, releaseProb: 0.5, reuptakeRate: 0.05 }
            },
            schizophrenia: {
                id: 'schizophrenia',
                name: { en: 'Schizophrenia (Dopamine Hypothesis)', es: 'Esquizofrenia' },
                description: 'Increased D2 receptor density and dysregulated dopamine release.',
                modifiers: { receptorDensity: 1.8, releaseProb: 0.8, reuptakeRate: 0.03 }
            },
            alzheimers: {
                id: 'alzheimers',
                name: { en: 'Alzheimer\'s (Synaptic Loss)', es: 'Alzheimer' },
                description: 'Reduced synaptic vesicle density and impaired signaling.',
                modifiers: { receptorDensity: 0.6, releaseProb: 0.3, reuptakeRate: 0.08 }
            },
            depression: {
                id: 'depression',
                name: { en: 'Major Depressive Disorder', es: 'Depresión Mayor' },
                description: 'Reduced serotonin availability and receptor sensitivity.',
                modifiers: { receptorDensity: 0.7, releaseProb: 0.4, reuptakeRate: 0.1 }
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
            agonist: { name: 'Agonist', targetReceptor: 'gpcr', effect: 'activate' },
            ttx: { name: 'Tetrodotoxin', targetIon: 'sodium', effect: 'block_ion_channel' },
            benzodiazepine: { name: 'Benzodiazepine', targetReceptor: 'ionotropic_receptor', effect: 'positive_allosteric_modulator' }
        },

        retrograde: {
            endocannabinoid: { name: '2-AG / Anandamide', color: '#9C27B0', effect: 'inhibit_release' }
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

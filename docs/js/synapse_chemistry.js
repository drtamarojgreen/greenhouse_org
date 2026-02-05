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
                pKa: 2.1,
                kinetics: { kon: 1.5, koff: 0.8, hill: 1.2 },
                synthesis: ['α-Ketoglutarate', 'Glutamate Dehydrogenase', 'Glutamate'],
                nmr: '2.0-2.5 ppm (β,γ-CH2), 3.7 ppm (α-CH)'
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
                pKa: 4.2,
                kinetics: { kon: 1.2, koff: 0.6, hill: 1.5 },
                synthesis: ['Glutamate', 'GAD65/67', 'GABA'],
                nmr: '1.9 ppm (β-CH2), 2.3 ppm (α-CH2), 3.0 ppm (γ-CH2)'
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
                pKa: 8.9,
                kinetics: { kon: 0.8, koff: 0.4, hill: 1.0 },
                synthesis: ['Tyrosine', 'Tyrosine Hydroxylase', 'L-DOPA', 'AADC', 'Dopamine'],
                nmr: '2.8 ppm (β-CH2), 3.1 ppm (α-CH2), 6.6-6.8 ppm (Aromatic)'
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
                pKa: 9.5,
                kinetics: { kon: 0.9, koff: 0.5, hill: 1.0 },
                synthesis: ['Tryptophan', 'Tryptophan Hydroxylase', '5-HTP', 'AADC', 'Serotonin'],
                nmr: '2.9 ppm (β-CH2), 3.2 ppm (α-CH2), 6.8-7.3 ppm (Indole)',
                aromatic_rings: 1, // Indole ring
                h_bond_acceptors: 2
            },
            norepinephrine: {
                id: 'norepinephrine',
                name: { en: 'Norepinephrine', es: 'Norepinefrina' },
                type: 'modulatory',
                color: '#FF4500', // Orange Red
                glow: 'rgba(255, 69, 0, 0.6)',
                targets: ['gpcr'],
                ionEffect: 'none',
                reuptakeVia: 'NET',
                enzyme: 'COMT',
                molecularWeight: '169.18 g/mol',
                pKa: 8.6,
                kinetics: { kon: 0.7, koff: 0.4, hill: 1.0 },
                synthesis: ['Dopamine', 'Dopamine β-hydroxylase', 'Norepinephrine'],
                nmr: '2.7 ppm (β-CH2), 3.0 ppm (α-CH2), 6.5-6.7 ppm (Aromatic)',
                aromatic_rings: 1, // Catechol ring
                h_bond_acceptors: 3
            }
        },

        receptors: {
            ionotropic_receptor: {
                id: 'ionotropic_receptor',
                name: { en: 'Ionotropic Receptor', es: 'Receptor Ionotrópico' },
                binds: ['glutamate', 'gaba'],
                stoichiometry: 'Pentameric (α2βγδ)',
                pdbId: '6X3Z',
                offTargetAffinities: { serotonin: 0.05 },
                polypeptide_chains: 5,
                amino_acids: 2400,
                hydrophobic_region: 'Transmembrane pore',
                termini: 'Extracellular N, Intracellular C'
            },
            gpcr: {
                id: 'gpcr',
                name: { en: 'GPCR', es: 'Receptor acoplado a proteína G' },
                binds: ['serotonin', 'dopamine', 'norepinephrine'],
                stoichiometry: 'Monomeric / Heterodimeric',
                pdbId: '7E2X',
                topology: '7TM Helices',
                offTargetAffinities: { glutamate: 0.02 },
                polypeptide_chains: 1,
                amino_acids: 450,
                hydrophobic_region: '7TM Bundle',
                transmembrane_helices: 7,
                termini: 'Extracellular N, Intracellular C'
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
            },
            autism: {
                id: 'autism',
                name: { en: 'Autism (SHANK3 mutation)', es: 'Autismo' },
                description: 'Altered scaffolding protein density and synaptic organization.',
                modifiers: { receptorDensity: 0.9, releaseProb: 0.5, reuptakeRate: 0.05, shankMutation: true }
            },
            fearConditioning: {
                id: 'fearConditioning',
                name: { en: 'Fear Conditioning (Amygdala)', es: 'Condicionamiento de Miedo' },
                description: 'Rapid LTP induction and increased receptor recruitment.',
                modifiers: { receptorDensity: 1.5, releaseProb: 0.7, reuptakeRate: 0.04, rapidLTP: true }
            },
            adolescent: {
                id: 'adolescent',
                name: { en: 'Adolescent Development', es: 'Desarrollo Adolescente' },
                description: 'Active synaptic pruning and dynamic receptor expression.',
                modifiers: { receptorDensity: 1.2, releaseProb: 0.6, reuptakeRate: 0.06, pruningActive: true }
            },
            chronicStress: {
                id: 'chronicStress',
                name: { en: 'Chronic Stress (Cortisol)', es: 'Estrés Crónico' },
                description: 'Cortisol-mediated reduction in hippocampal synaptic connectivity.',
                modifiers: { receptorDensity: 0.5, releaseProb: 0.4, reuptakeRate: 0.1, cortisolActive: true }
            }
        },

        metaAnalysis: {
            glutamate: [
                { source: 'Nature Neuroscience (2022)', findings: 'Glutamate clearance is 30% slower in astrocytes lacking GLT-1.' },
                { source: 'Journal of Biochemistry (2023)', findings: 'Vesicular pH affects glutamate loading efficiency by 15%.' }
            ],
            serotonin: [
                { source: 'Pharmacology Reviews (2021)', findings: 'SERT occupancy reaches 80% at standard SSRI clinical doses.' },
                { source: 'Molecular Psychiatry (2024)', findings: '5-HT1A auto-receptor desensitization follows a 2-week lag period.' }
            ]
        },

        transporters: {
            EAAT: { name: 'Excitatory Amino Acid Transporter', targets: ['glutamate'] },
            GAT: { name: 'GABA Transporter', targets: ['gaba'] },
            SERT: { name: 'Serotonin Transporter', targets: ['serotonin'], transmembrane_helices: 12, polypeptide_chains: 1 },
            DAT: { name: 'Dopamine Transporter', targets: ['dopamine'], transmembrane_helices: 12, polypeptide_chains: 1 },
            NET: { name: 'Norepinephrine Transporter', targets: ['norepinephrine'], transmembrane_helices: 12, polypeptide_chains: 1 },
            VMAT1: { name: 'Vesicular Monoamine Transporter 1', targets: ['serotonin', 'dopamine', 'norepinephrine'] },
            VMAT2: { name: 'Vesicular Monoamine Transporter 2', targets: ['serotonin', 'dopamine', 'norepinephrine'] },
            ZnT: { name: 'Zinc Transporter', targets: ['zinc'] }
        },

        enzymes: {
            MAO: { name: 'Monoamine Oxidase', targets: ['serotonin', 'dopamine'], rate: 0.01 },
            COMT: { name: 'Catechol-O-methyltransferase', targets: ['dopamine'], rate: 0.008 },
            AChE: { name: 'Acetylcholinesterase', targets: ['acetylcholine'], rate: 0.1 }
        },

        drugs: {
            ssri: { name: 'SSRI', targetTransporter: 'SERT', effect: 'block_reuptake', safetyThreshold: 70 },
            serotonin_receptor_modulator: { name: '5-HT Receptor Modulator', targetReceptor: 'gpcr', effect: 'modulate', safetyThreshold: 75 },
            antagonist: { name: 'Antagonist', targetReceptor: 'ionotropic_receptor', effect: 'block_binding', safetyThreshold: 60 },
            agonist: { name: 'Agonist', targetReceptor: 'gpcr', effect: 'activate', safetyThreshold: 80 },
            ttx: { name: 'Tetrodotoxin', targetIon: 'sodium', effect: 'block_ion_channel', safetyThreshold: 10 },
            benzodiazepine: { name: 'Benzodiazepine', targetReceptor: 'ionotropic_receptor', effect: 'positive_allosteric_modulator', safetyThreshold: 50 },
            levodopa: { name: 'L-DOPA', type: 'prodrug', precursorOf: 'dopamine', conversionRate: 0.05 }
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
                effect: 'depolarize',
                hydrationRadius: 2.8 // Angstroms
            },
            potassium: {
                id: 'potassium',
                name: { en: 'Potassium (K+)', es: 'Potasio (K+)' },
                charge: '+',
                color: '#ff00ff', // Magenta
                effect: 'repolarize',
                hydrationRadius: 3.3
            },
            chloride: {
                id: 'chloride',
                name: { en: 'Chloride (Cl-)', es: 'Cloro (Cl-)' },
                charge: '-',
                color: '#adff2f', // Greenish Yellow
                effect: 'hyperpolarize',
                hydrationRadius: 3.3
            },
            calcium: {
                id: 'calcium',
                name: { en: 'Calcium (Ca2+)', es: 'Calcio (Ca2+)' },
                charge: '++',
                color: '#ffffff', // White
                effect: 'plasticity',
                hydrationRadius: 4.1
            },
            zinc: {
                id: 'zinc',
                name: { en: 'Zinc (Zn2+)', es: 'Zinc (Zn2+)' },
                charge: '++',
                color: '#C0C0C0', // Silver
                effect: 'modulation',
                hydrationRadius: 4.3
            }
        }
    };
})();

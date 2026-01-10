// docs/js/synapse_elements.js
// Visual definitions and drawing functions for the Synapse Visualization

(function () {
    'use strict';

    const config = {
        // High-Contrast & Semantic Color System
        backgroundColor: '#F8F9FA', // Light, clean background
        // Structures (Warm, Organic)
        preSynapticColor: '#A1887F', // Softer, earthy brown
        postSynapticColor: '#795548', // Darker, grounded brown
        // Vesicles (Action-oriented, but not harsh)
        vesicleColor: '#FFAB91', // Soft coral
        // Neurotransmitters & Signals (Clear & Informative)
        neurotransmitterColor: { r: 255, g: 138, b: 101 }, // Coral color for particles
        neuromodulatorColor: { r: 129, g: 212, b: 250 }, // Soft blue
        // Receptors (Distinct & Functional)
        ionChannelColor: '#4DB6AC', // Muted Teal
        gpcrColor: '#7986CB', // Indigo
        // Blockers (Warning, but accessible)
        blockerColor: '#E57373', // Soft Red
        // UI & Text
        titleFont: 'bold 24px "Helvetica Neue", Arial, sans-serif',
        titleColor: '#212529', // High-contrast black
        labelFont: '14px "Helvetica Neue", Arial, sans-serif',
        labelColor: '#495057',
        tooltipBg: 'rgba(33, 37, 41, 0.85)',
        tooltipColor: '#FFFFFF',

        translations: {
            // Tooltips
            preSynapticTerminal: { en: 'Pre-Synaptic Terminal', es: 'Terminal Presináptica' },
            postSynapticTerminal: { en: 'Post-Synaptic Terminal', es: 'Terminal Postsináptica' },
            vesicle: { en: 'Vesicle', es: 'Vesícula' },
            ionChannel: { en: 'Ion Channel', es: 'Canal Iónico' },
            gpcr: { en: 'G-protein Coupled Receptor', es: 'Receptor acoplado a proteína G' },
            calciumBlocker: { en: 'Calcium Channel Blocker', es: 'Bloqueador de Canal de Calcio' },
            // Title
            synapticCleft: { en: 'Synaptic Cleft Visualization', es: 'Visualización de la Hendidura Sináptica' },
            // Legend
            legendTitle: { en: 'Legend', es: 'Leyenda' },
            legendNeurotransmitter: { en: 'Neurotransmitter', es: 'Neurotransmisor' },
            legendNeuromodulator: { en: 'Neuromodulator', es: 'Neuromodulador' }
        },
        vesicles: [
            { id: 'vesicle', x: 0.2, y: 0.2, r: 15 },
            { id: 'vesicle', x: 0.5, y: 0.15, r: 20 },
            { id: 'vesicle', x: 0.8, y: 0.25, r: 18 }
        ],
        ionChannels: [
            { id: 'ionChannel', x: 0.2 },
            { id: 'ionChannel', x: 0.6 }
        ],
        gpcrs: [
            { id: 'gpcr', x: 0.4 },
            { id: 'gpcr', x: 0.8 }
        ],
        calciumBlockers: [
            { id: 'calciumBlocker', x: 0.2 }
        ]
    };

    window.SynapseElements = {
        config: config
    };
})();

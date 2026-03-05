/**
 * @file inflammation_config.js
 * @description Configuration for the Neuroinflammation Simulation.
 * Reconfigured with binary factors (Checkboxes) for triggers and interventions.
 */

(function () {
    'use strict';

    const GreenhouseInflammationConfig = {
        factors: [
            {
                id: 'viewMode', label: 'label_view_mode', defaultValue: 0, options: [
                    { value: 0, label: 'REGULATORY (MACRO)' },
                    { value: 1, label: 'CELLULAR (MICRO)' },
                    { value: 2, label: 'MOLECULAR' },
                    { value: 3, label: 'PATHWAY (KEGG)' }
                ], type: 'button'
            },
            {
                id: 'activePathway', label: 'Select Specialized Pathway', defaultValue: 'tryptophan', options: [
                    { value: 'tryptophan', label: 'Tryptophan-Kynurenine' },
                    { value: 'protein_kinase', label: 'Signal Cascade (MAPK)' }
                ], type: 'select'
            },

            // --- ENVIRONMENTAL (TRIGGERS) ---
            { id: 'pathogenActive', label: 'Pathogen Presence', type: 'checkbox', defaultValue: 0, impact: 0.4, category: 'env' },
            { id: 'chronicStress', label: 'Chronic Cortisol Exposure', type: 'checkbox', defaultValue: 1, impact: 0.25, category: 'env' },
            { id: 'poorSleep', label: 'Sleep Deprivation', type: 'checkbox', defaultValue: 0, impact: 0.2, category: 'env' },
            { id: 'pollutionExposure', label: 'Environmental Pollutants', type: 'checkbox', defaultValue: 0, impact: 0.2, category: 'env' },

            // --- PSYCHOLOGICAL / LIFESTYLE (PROTECTIVE) ---
            { id: 'cleanDiet', label: 'Polyphenol-Rich Diet', type: 'checkbox', defaultValue: 1, impact: -0.15, category: 'psych' },
            { id: 'exerciseRegular', label: 'Regular Aerobic Exercise', type: 'checkbox', defaultValue: 0, impact: -0.2, category: 'psych' },
            { id: 'meditationPractice', label: 'Vagus Nerve Stimulation', type: 'checkbox', defaultValue: 0, impact: -0.15, category: 'psych' },

            // --- PHILOSOPHICAL / COGNITIVE ---
            { id: 'cognitiveResilience', label: 'Cognitive Reframing', type: 'checkbox', defaultValue: 0, impact: -0.1, category: 'philo' },
            { id: 'socialSupport', label: 'Social Connectivity', type: 'checkbox', defaultValue: 1, impact: -0.15, category: 'philo' },

            // --- RESEARCH / PHARMA ---
            { id: 'leakyGut', label: 'Intestinal Permeability', type: 'checkbox', defaultValue: 0, impact: 0.15, category: 'research' },
            { id: 'showVolumeBounds', label: 'Micro Volume Bounds', type: 'checkbox', defaultValue: 0, category: 'research' },
            { id: 'showReceptors', label: 'Show Receptor Sites', type: 'checkbox', defaultValue: 0, category: 'research' },
            { id: 'showBridgeOverlay', label: 'Signaling Bridge Overlay', type: 'checkbox', defaultValue: 0, category: 'research' },
            { id: 'colorTheme', label: 'Color Theme', defaultValue: 'default', options: [
                { value: 'default', label: 'DEFAULT' },
                { value: 'deuteranopia', label: 'DEUTERANOPIA' }
            ], type: 'select', category: 'research' },
            { id: 'showMoleculeLabels', label: 'Show Molecule Labels', type: 'checkbox', defaultValue: 1, category: 'research' },
            { id: 'showMechanismLabels', label: 'Show Mechanism Labels', type: 'checkbox', defaultValue: 0, category: 'research' },
            { id: 'showCompartmentLabels', label: 'Show Compartment Labels', type: 'checkbox', defaultValue: 0, category: 'research' },
            { id: 'antioxidants', label: 'N-Acetylcysteine (NAC)', type: 'checkbox', defaultValue: 0, impact: -0.15, category: 'research' },
            { id: 'nsaidsApp', label: 'COX Inhibition (NSAIDs)', type: 'checkbox', defaultValue: 0, impact: -0.25, category: 'research' },
            { id: 'steroidsApp', label: 'Glucocorticoids', type: 'checkbox', defaultValue: 0, impact: -0.5, category: 'research' },
            { id: 'tnfInhibitors', label: 'Anti-TNF Biologics', type: 'checkbox', defaultValue: 0, impact: -0.4, category: 'research' },

            // --- DEMOGRAPHICS & CLINICAL ---
            { id: 'agePreset', label: 'Developmental Age (Vulnerability)', type: 'checkbox', defaultValue: 0, impact: 0.1, category: 'clinical' },
            { id: 'sexSpecific', label: 'Sex-Specific Response', type: 'checkbox', defaultValue: 0, impact: 0.05, category: 'clinical' },
            { id: 'comorbidityDiabetes', label: 'Comorbidity: Diabetes', type: 'checkbox', defaultValue: 0, impact: 0.2, category: 'clinical' },
            { id: 'medicationEffect', label: 'Expected Medication Response', type: 'checkbox', defaultValue: 0, impact: -0.3, category: 'clinical' },

            // --- ADVANCED SIGNALING CONTROLS (Enhancements 4-40) ---
            { id: 'showSignalingNetwork', label: 'Ligand-Receptor Network', type: 'checkbox', defaultValue: 1, category: 'research' },
            { id: 'toggleIL6Mode', label: 'IL-6: Trans-Signaling Mode', type: 'checkbox', defaultValue: 0, category: 'research' },
            { id: 'showTranscriptionOverlays', label: 'TF Activity Overlays (NF-κB/AP-1)', type: 'checkbox', defaultValue: 1, category: 'research' },
            { id: 'toggleEpigeneticBalance', label: 'HDAC/HAT Balance (Plasticity)', type: 'checkbox', defaultValue: 0, category: 'research' }
        ],
        metrics: [
            { id: 'tnfAlpha', label: 'Pro-Inflammatory Tone (TNF-α)', unit: '%' },
            { id: 'il10', label: 'Anti-Inflammatory Reserve (IL-10)', unit: '%' },
            { id: 'neuroprotection', label: 'Neuroprotection Index', unit: '%' },
            { id: 'stressBurden', label: 'Allostatic Load (Stress)', unit: '%' },
            { id: 'regionConfidence', label: 'Region Confidence Score', unit: '%' },
            { id: 'riskLevel', label: 'Risk Stratification', unit: 'lvl' },

            // Molecular Signaling Metrics (4-40)
            { id: 'tryptase', label: 'Tryptase (Mast Release)', unit: 'ng' },
            { id: 'chymase', label: 'Chymase (Protease)', unit: 'ng' },
            { id: 'nfkbActivation', label: 'NF-κB Translocation', unit: '%' },
            { id: 'atp', label: 'Extracellular ATP', unit: 'uM' },
            { id: 'ros', label: 'Reactive Oxygen Species', unit: '%' },
            { id: 'calcium', label: 'Cytosolic Calcium [Ca2+]', unit: 'nM' },
            { id: 'nlrp3State', label: 'NLRP3 Inflammasome', unit: 'act' },
            { id: 'jakStat', label: 'JAK/STAT Activation', unit: '%' },
            { id: 'mapk', label: 'MAPK (p38/JNK/ERK)', unit: '%' },
            { id: 'pi3kAkt', label: 'PI3K/AKT Pathway', unit: '%' },
            { id: 'campPka', label: 'cAMP/PKA (Checkpoint)', unit: '%' }
        ],
        atlasLegend: {
            'microglia': { region: 'hippocampus CA1', color: '#ff4444' },
            'astrocyte': { region: 'thalamus', color: '#ffcc00' },
            'tnfAlpha': { region: 'basal ganglia', color: '#ff5533' },
            'il10': { region: 'prefrontal cortex', color: '#00ff99' },
            'trp': { region: 'gut/blood', color: '#64FFC8' },
            'kyn': { region: 'brain_isf', color: '#FFD264' },
            'quin': { region: 'neurotoxic', color: '#FF3200' }
        },
        diseasePresets: {
            'AD': { factors: ['chronicStress', 'poorSleep'], regions: ['hippocampus', 'pfc'] },
            'MS': { factors: ['pathogenActive', 'leakyGut'], regions: ['brain_stem', 'optic_nerve'] },
            'PD': { factors: ['pollutionExposure', 'chronicStress'], regions: ['basal_ganglia', 'vta'] }
        },
        lobes: [
            { id: 'frontal', label: 'Frontal Lobe', color: 'rgba(255, 100, 100, 0.2)' },
            { id: 'parietal', label: 'Parietal Lobe', color: 'rgba(100, 255, 100, 0.2)' },
            { id: 'temporal', label: 'Temporal Lobe', color: 'rgba(100, 100, 255, 0.2)' },
            { id: 'occipital', label: 'Occipital Lobe', color: 'rgba(255, 255, 100, 0.2)' },
            { id: 'insular', label: 'Insular Lobe', color: 'rgba(255, 100, 255, 0.2)' }
        ],
        brodmannAreas: [
            { id: 'BA9', label: 'DLPFC (BA9)', region: 'pfc' },
            { id: 'BA24', label: 'ACC (BA24)', region: 'cingulate' }
        ]
    };

    window.GreenhouseInflammationConfig = GreenhouseInflammationConfig;
})();

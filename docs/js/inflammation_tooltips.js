/**
 * @file inflammation_tooltips.js
 * @description Tooltip definitions and drawing logic for the Inflammation App.
 */

(function () {
    'use strict';

    const t = (k) => window.GreenhouseModelsUtil ? window.GreenhouseModelsUtil.t(k) : k;

    const GreenhouseInflammationTooltips = {
        definitions: {
            pathogenActive: 'Detection of invasive pathogens or metabolic toxins in systemic circulation.',
            chronicStress: 'Durable cortisol elevation which compromises the structural integrity of the BBB.',
            poorSleep: 'Suppresses the glympathic system, leading to the accumulation of amyloid-beta and cytokines.',
            leakyGut: 'Translocation of LPS (lipopolysaccharides) from the gut to the bloodstream.',
            cleanDiet: 'High intake of anti-inflammatory polyphenols and omega-3 fatty acids.',
            exerciseRegular: 'Stimulates myokine (IL-6) release which induces systemic anti-inflammatory IL-10.',
            nsaidsApp: 'Cox-1/Cox-2 inhibition; provides rapid reduction of acute inflammatory signaling.',
            steroidsApp: 'Broad-spectrum glucocorticoid action; stabilizes microglia and suppresses cytokine storms.',
            tnfInhibitors: 'Specific blockade of TNF-alpha, the primary driver of systemic and central inflammation.',
            showMoleculeLabels: 'Toggle visibility of individual molecule names in the flow animation.',
            showMechanismLabels: 'Toggle visibility of metabolic enzymes and transporters (e.g., IDO, LAT1).',
            showCompartmentLabels: 'Toggle visibility of anatomical compartment boundaries and names.',

            // Molecules
            TRP: 'Tryptophan: An essential amino acid and precursor to serotonin and kynurenine.',
            KYN: 'Kynurenine: A central metabolite in the tryptophan pathway; shifts toward QUIN under inflammation.',
            '3HAA': '3-Hydroxyanthranilic acid: A kynurenine metabolite that can be both immunomodulatory and neurotoxic.',
            QUIN: 'Quinolinic Acid: A potent NMDA receptor agonist and neurotoxin produced by activated microglia.',
            KYNA: 'Kynurenic Acid: An NMDA receptor antagonist produced by astrocytes; generally neuroprotective.',
            '5HT': 'Serotonin (5-Hydroxytryptamine): A key neurotransmitter for mood; synthesis drops during inflammation.',
            DA: 'Dopamine: A neurotransmitter critical for reward and motor control; affected by neuroinflammation.',
            GLU: 'Glutamate: The primary excitatory neurotransmitter; excess leads to excitotoxicity.',

            // Metrics
            tnfAlpha: 'Tumor Necrosis Factor alpha: The master orchestrator of the pro-inflammatory response.',
            il10: 'Interleukin 10: A potent anti-inflammatory cytokine that prevents excessive tissue damage.',
            bbbIntegrity: 'The functional status of the Blood-Brain Barrier; lower values indicate leukocyte infiltration.',
            neuroprotection: 'The composite health score of neurons based on cytokine environment and glial state.',
            tryptase: 'Tryptase: A serine protease released by mast cells; activates PAR2 on glia to promote inflammation.',
            chymase: 'Chymase: A mast cell protease that cleaves substrates to modulate glial activation and ECM remodeling.',
            atp: 'Extracellular ATP: Released by stressed cells as a DAMP; activates purinergic receptors (P2X7) on glia.',
            ros: 'Reactive Oxygen Species: Chemically reactive molecules that cause oxidative stress and prime the inflammasome.',
            calcium: 'Cytosolic Calcium: A universal signaling messenger; spikes during cell activation and stress.',
            nfkbActivation: 'NF-κB: A master transcription factor that translocates to the nucleus to trigger pro-inflammatory gene expression.',
            nlrp3State: 'NLRP3 Inflammasome: A multiprotein complex that processes pro-IL-1β into its active, secreted form.',
            jakStat: 'JAK/STAT: A signaling pathway primarily driven by cytokines like IL-6; regulates immune cell phenotypes.',
            mapk: 'MAPK: Mitogen-Activated Protein Kinase pathways (p38, JNK, ERK) that relay extracellular signals to the nucleus.',
            pi3kAkt: 'PI3K/AKT: A critical survival and growth signaling pathway that is often suppressed during chronic inflammation.',
            campPka: 'cAMP/PKA: An anti-inflammatory signaling checkpoint that suppresses NF-κB and promotes resolution.',
            showSignalingNetwork: 'Overlay representing ligand-receptor exchange pairs and signaling directionality.',
            toggleIL6Mode: 'Switch between classic signaling and trans-signaling (sIL-6R) modes for IL-6.',
            showTranscriptionOverlays: 'Visualize transcription factor activity curves (NF-κB, AP-1) near cell nuclei.',
            toggleEpigeneticBalance: 'Adjust the balance between HDAC and HAT activity, affecting chromatin accessibility.',

            // Regions
            thalamus: 'Thalamus: Central relay station; high inflammation here disrupts sensory processing and mood.',
            hypothalamus: 'Hypothalamus: Regulates systemic homeostasis; primary sensor for circulating inflammatory cytokines.',
            insula: 'Insula: Monitors the internal state of the body (interoception); key to the "sickness behavior" response.',
            basal_ganglia: 'Basal Ganglia: Mediates motor control and reward; inflammation here is linked to fatigue and anhedonia.',

            // NVU components
            bbb: 'Blood-Brain Barrier (BBB): A highly selective semipermeable border that prevents solutes in the circulating blood from non-selectively crossing into the CNS.',
            vessel: 'Microcapillary: The primary site of nutrient exchange and immune cell trafficking in the brain.',
            glia_m1: 'M1 Microglia: The "classicially activated" pro-inflammatory phenotype; releases TNF-α and IL-1β.',
            glia_m2: 'M2 Microglia: The "alternatively activated" anti-inflammatory phenotype; involved in tissue repair and resolution.',
            mast_cell: 'Mast Cell: Immune cell residing near vessels; contains granules with histamine and TNF-α that can rapidly trigger inflammation.',
            astrocyte: 'Astrocyte: Star-shaped glial cell that maintains the blood-brain barrier via endfeet and regulates the chemical environment.',
            microglia: 'Microglia: The resident immune cells of the CNS, acting as the first and main form of active immune defense.',
            keyboard_shortcuts: 'Keyboard Shortcuts: [1-4] Switch View Modes; [H] Toggle Hemispheres; [R] Export Simulation State; [Space] Pause Simulation.'
        },

        draw(ctx, app, x, y) {
            const el = app.ui.hoveredElement;
            if (!el) return;

            const desc = this.definitions[el.id] || el.description || 'Inflammatory simulation component.';
            const label = el.label || el.id;

            ctx.save();
            ctx.font = '11px Quicksand, sans-serif';
            const padding = 15;
            const maxWidth = 250;

            const words = desc.split(' ');
            let lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                let testLine = currentLine + " " + words[i];
                if (ctx.measureText(testLine).width > maxWidth) {
                    lines.push(currentLine);
                    currentLine = words[i];
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            const h = 45 + lines.length * 15;
            const w = maxWidth + padding * 2;

            let tx = x + 15;
            let ty = y + 15;
            if (tx + w > app.canvas.width) tx = x - w - 15;
            if (ty + h > app.canvas.height) ty = y - h - 15;

            ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            if (app.roundRect) app.roundRect(ctx, tx, ty, w, h, 10, true, false);

            ctx.fillStyle = '#4ca1af';
            ctx.font = 'bold 11px Quicksand, sans-serif';
            ctx.fillText(t(label).toUpperCase(), tx + padding, ty + 25);

            ctx.fillStyle = '#fff';
            ctx.font = '11px Quicksand, sans-serif';
            lines.forEach((line, i) => {
                ctx.fillText(line, tx + padding, ty + 45 + i * 15);
            });

            ctx.restore();
        }
    };

    window.GreenhouseInflammationTooltips = GreenhouseInflammationTooltips;
})();

// docs/js/models_util.js

(function () {
    'use strict';

    /**
     * @class GreenhouseComponent
     * Base class for all visual components in the system.
     * Implements #36 Component-Based Architecture.
     */
    class GreenhouseComponent {
        constructor(name, layer = 10) {
            this.name = name;
            this.layer = layer; // Lower numbers draw first (background), higher numbers draw last (UI)
            this.active = true;
            this.initialized = false;
        }

        /**
         * Called once when the component is added to the system.
         * @param {GreenhouseSystem} system
         */
        init(system) {
            this.system = system;
            this.initialized = true;
        }

        /**
         * Called every frame to update state.
         * @param {number} deltaTime - Time since last frame in ms.
         */
        update(deltaTime) { }

        /**
         * Called every frame to draw to the canvas.
         * @param {CanvasRenderingContext2D} ctx
         */
        draw(ctx) { }
    }

    /**
     * @class GreenhouseSystem
     * Central rendering engine.
     * Implements #41 Error Boundary, #42 Configurable Render Quality, #8 Layered Canvases.
     */
    class GreenhouseSystem {
        constructor(canvas, config = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d', { alpha: false }); // Optimization
            this.components = [];
            this.quality = config.quality || 1.0;
            this.lastFrameTime = 0;

            // #41 Error Boundary
            this.errorHandler = config.errorHandler || ((e) => console.error("Rendering Error:", e));
        }

        /**
         * Adds a component to the system.
         * @param {GreenhouseComponent} component
         */
        addComponent(component) {
            this.components.push(component);
            this.components.sort((a, b) => a.layer - b.layer);
            if (!component.initialized) {
                component.init(this);
            }
        }

        /**
         * Renders a single frame.
         * @param {number} timestamp
         */
        renderFrame(timestamp = performance.now()) {
            try {
                const deltaTime = timestamp - this.lastFrameTime;
                this.lastFrameTime = timestamp;

                // #7 Integer Coordinates & #42 Render Quality
                const width = this.canvas.width;
                const height = this.canvas.height;

                // Clear Canvas
                this.ctx.clearRect(0, 0, width, height);

                // Render Loop
                for (const component of this.components) {
                    if (component.active) {
                        component.update(deltaTime);
                        component.draw(this.ctx, width, height);
                    }
                }

                // Signal for testing
                window.renderingComplete = true;

            } catch (error) {
                this.errorHandler(error);
            }
        }
    }

    /**
     * @class GreenhouseAssetManager
     * Manages assets and sprite atlases.
     * Implements #10 Asset Preloading, #5 Sprite Atlases.
     */
    class GreenhouseAssetManager {
        constructor() {
            this.assets = new Map();
            this.loading = false;
        }

        async loadImage(key, url) {
            if (this.assets.has(key)) return this.assets.get(key);

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.assets.set(key, img);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = url;
            });
        }

        get(key) {
            return this.assets.get(key);
        }
    }

    const GreenhouseModelsUtil = {
        currentLanguage: 'en',

        translations: {
            en: {
                // Consent Screen
                consent_title: "Exploring Neural Plasticity: A CBT & DBT Model",
                consent_desc: "An interactive simulation to help you visualize how therapeutic practices can change the brain.",
                disclaimer: "Please Note: This is an educational simulation, not a medical tool.",
                consent_check: "I acknowledge that this is an educational tool and not a substitute for professional medical advice.",
                launch_btn: "Launch Simulation",
                err_loading_models: "Error loading model descriptions. Please try again later.",

                // Simulation Interface
                edu_banner: "For Educational Purposes: This model simulates conceptual brain activity.",

                // Synapse Items
                label_vesicle: "Vesicle",
                label_receptor: "Receptor",
                label_neurotransmitter: "Neurotransmitter",
                label_ion_channel: "Ion Channel",
                label_kinase: "Protein Kinase",
                label_rna: "mRNA",

                // Metrics
                metrics_title_synaptic: "Real-Time Metrics (synaptic)",
                metrics_title_network: "Real-Time Metrics (network)",
                metric_weight: "Synaptic Weight",
                metric_neuro: "Neurotransmitters Released",
                metric_ions: "Ions Crossed",
                metric_learning: "Learning Metric",

                // Controls
                controls_title_synaptic: "Simulation Controls (synaptic)",
                controls_title_network: "Simulation Controls (network)",
                controls_title_environment: "Environment Controls",
                controls_title_general: "General Controls",

                label_intensity: "Practice Intensity",
                label_speed: "Simulation Speed",
                option_slow: "Slow",
                option_normal: "Normal",
                option_fast: "Fast",

                btn_play: "Play",
                btn_pause: "Pause",
                btn_reset_plasticity: "Reset Plasticity",

                label_stress: "Environmental Stress",
                label_support: "Social Support Level",
                label_genetic: "Genetic Factors",
                btn_gene_a: "Gene A",
                btn_gene_b: "Gene B",

                btn_reset_sim: "Reset Simulation",
                btn_share: "Share View",
                btn_download: "Download Image",
                btn_dark_mode: "Toggle Dark Mode",
                btn_fullscreen: "Full Screen",
                btn_language: "Español", // Label to switch TO Spanish

                // Shared Simulation Terms
                "signaling": "Signaling",
                "scenarios": "Scenarios",
                "pharmacology": "Pharmacology",
                "settings": "Settings",
                "accessibility": "Accessibility",
                "aesthetics": "Aesthetics",
                "feedback": "Feedback",
                "temporal": "Temporal",
                "pause": "Pause",
                "involved_regions": "Involved Regions",
                "wellness_focus": "Wellness Focus",
                "clinical_relevance": "Clinical Relevance",
                "initializing": "Initializing...",
                "gen": "Gen",
                "fitness": "Fitness",
                "best_fitness": "Best Fitness",
                "used": "Used",
                "ph": "pH",
                "temp": "Temp",
                "high_contrast": "High Contrast",
                "large_scale_ui": "Large Scale UI",
                "reduced_motion": "Reduced Motion",
                "mobile_interaction_hint": "DRAG to rotate • CLICK regions",
                "limbic_system": "Limbic System",
                "active_theory": "Active Theory",
                "cerebral_cortex": "Cerebral Cortex",
                "active_enhancement": "Active Enhancement",
                "atp_consumed": "ATP Consumed",
                "genomic_integrity": "Genomic Integrity",
                "mutations": "Mutations",
                "successful_repairs": "Successful Repairs",
                "error_prone": "Error Prone",
                "whole_brain_topology": "Whole Brain Topology",

                // Model Specific Titles
                "emotion_app_title": "Emotion Simulation",
                "emotion_app_desc": "Explore neurological pathways and emotional regulation.",
                "emotion_cat_philosophies": "Philosophical Frameworks",
                "emotion_phil_stoicism_name": "Stoicism",
                "emotion_phil_buddhism_name": "Buddhism",
                "emotion_phil_existentialism_name": "Existentialism",
                "emotion_phil_taoism_name": "Taoism",
                "emotion_phil_nihilism_name": "Nihilism",
                "emotion_phil_epicureanism_name": "Epicureanism",
                "emotion_theory_gross_name": "Gross’s Process Model Stages",
                "emotion_theory_gross_desc": "Interactive 5-step timeline: Situation Selection -> Modification -> Attention -> Appraisal -> Response.",
                "emotion_theory_polyvagal_name": "Polyvagal \"Hierarchy of Response\"",
                "emotion_theory_polyvagal_desc": "Color-coded states: Social Engagement (Green), Fight/Flight (Yellow), Freeze/Shutdown (Red).",
                "emotion_reg_pfc_name": "Prefrontal Cortex",
                "emotion_reg_dlpfc_name": "Dorsolateral PFC",
                "emotion_reg_vmpfc_name": "Ventromedial PFC",
                "emotion_reg_ofc_name": "Orbitofrontal Cortex",
                "emotion_reg_amygdala_name": "Amygdala",
                "emotion_reg_hippocampus_name": "Hippocampus",
                "emotion_reg_hypothalamus_name": "Hypothalamus",
                "emotion_reg_thalamus_name": "Thalamus",
                "emotion_reg_brainstem_name": "Brainstem",
                "emotion_reg_insula_name": "Insula",
                "emotion_reg_acc_name": "Anterior Cingulate",
                "emotion_reg_subacc_name": "Subgenual ACC",
                "emotion_reg_striatum_name": "Striatum",
                "emotion_reg_nac_name": "Nucleus Accumbens",
                "emotion_cat_regulations": "Emotional Regulation",
                "emotion_cat_therapeutic": "Therapeutic Effects",
                "emotion_cat_medication": "Medication Treatments",
                "emotion_cat_advanced": "Regulation Theories",

                "cog_simulation": "Cognition Simulation",
                "cog_select_desc": "Select a cognitive theory to explore its neurological mapping.",
                "cog_search_placeholder": "Search enhancements...",
                "cog_glass_brain": "Glass Brain",
                "cog_reset_view": "Reset View",
                "cog_model_title": "Cognition Model",

                "neuro_dopamine_signaling": "Dopamine Signaling",
                "neuro_dopamine_select": "Select a mode to visualize pathway.",
                "neuro_serotonin_title": "Serotonin Structural Model",
                "neuro_serotonin_desc": "Visualization of 5-HT1A in complex with Gi.",

                "genetic_model_title": "Genetic Model",
                "pathway_control": "Pathway Control",
                "systemic_pathway": "Systemic Pathway",
                "component_gene": "Component/Gene",
                "highlight_pathway": "Highlight Pathway",
                "select_focus": "Select Focus...",

                "pip_dna": "DNA Double Helix",
                "pip_micro": "Micro View",
                "pip_protein": "Protein View",
                "pip_target": "Target View",

                // DNA Repair Buttons
                "Base Excision": "Base Excision",
                "Mismatch Repair": "Mismatch Repair",
                "Nucleotide Excision": "Nucleotide Excision",
                "Double-Strand Break": "Double-Strand Break",
                "Replication": "Replication",
                "Photolyase (Direct)": "Photolyase (Direct)",
                "MGMT Repair": "MGMT Repair",
                "NHEJ (Error Prone)": "NHEJ (Error Prone)",
                "Homologous Recomb": "Homologous Recomb",

                "Burst": "Explosión",
                "Idioma": "Idioma",

                how_to_title: "How to Use",
                how_to_synaptic: "Use the controls to see how different parameters affect the strength of neural connections in real-time.",
                how_to_env: "Use the sliders to adjust environmental stress and social support. Click the gene buttons to simulate genetic predispositions.",

                loading: "Loading Simulation...",

                // Environment Canvas
                env_title: "Mental Health Environment",
                env_subtitle: "Interactive Model",
                legend_title: "Influences",
                legend_family: "Family",
                legend_society: "Society",
                legend_community: "Community",
                label_therapy: "Therapy",
                label_medication: "Medication",

                // Config Labels (Keys match the English text in config)
                "Environmental Stress": "Environmental Stress",
                "Genetic Factors": "Genetic Factors",
                "Community": "Community",
                "Personal Growth": "Personal Growth",

                // Region Descriptions
                pfc_desc: "The Prefrontal Cortex is crucial for executive functions like planning, decision-making, and regulating social behavior.",
                amygdala_desc: "The Amygdala is central to processing emotions, particularly fear, and is a key part of the brain’s threat-detection system.",
                hippocampus_desc: "The Hippocampus plays a major role in learning and memory, converting short-term memories into more permanent ones.",
                parietalLobe_desc: "The Parietal Lobe processes sensory information regarding the location of parts of the body as well as interpreting visual information and processing language and mathematics.",
                occipitalLobe_desc: "The Occipital Lobe is the visual processing center of the mammalian brain containing most of the anatomical region of the visual cortex.",
                temporalLobe_desc: "The Temporal Lobe is involved in processing sensory input into derived meanings for the appropriate retention of visual memory, language comprehension, and emotion association.",
                cerebellum_desc: "The Cerebellum receives information from the sensory systems, the spinal cord, and other parts of the brain and then regulates motor movements.",
                brainstem_desc: "The Brainstem controls the flow of messages between the brain and the rest of the body, and it also controls basic body functions such as breathing, swallowing, heart rate, blood pressure, consciousness, and whether one is awake or sleepy.",
                no_info: "No information available for this region.",

                // Hovers
                activation_label: "Activation",

                // Regions Names
                "Prefrontal Cortex": "Prefrontal Cortex",
                "Amygdala": "Amygdala",
                "Hippocampus": "Hippocampus",

                // Medication & Therapy Panels
                "Active Prescriptions": "Recetas Activas",
                "Recent Sessions": "Sesiones Recientes",
                "No active medications.": "No hay medicamentos activos.",
                "No recent sessions recorded.": "No hay sesiones recientes registradas.",
                "Loading...": "Cargando...",

                // Alerts & Prompts
                "Simulation URL copied to clipboard!": "¡URL de la simulación copiada al portapapeles!",
                "Failed to copy URL. Please copy it manually:\n": "No se pudo copiar la URL. Por favor, cópiela manualmente:\n",
                "Error attempting to enable full-screen mode: ": "Error al intentar activar el modo de pantalla completa: ",

                "Medication": "Medicación",

                // Hover descriptions for interactive elements
                "medication_desc": "View active medications and their information.",
                "therapy_desc": "View recent therapy sessions and notes.",

                // Wellness Dimensions
                label_wellness_emotional: "Emotional",
                label_wellness_spiritual: "Spiritual",
                label_wellness_intellectual: "Intellectual",
                label_wellness_physical: "Physical",
                label_wellness_environmental: "Environmental",
                label_wellness_financial: "Financial",
                label_wellness_occupational: "Occupational",
                label_wellness_social: "Social",

                // Overlays
                dna_structure_metaphor: "Spaghetti Noodle",
                dna_structure_concept: "DNA Structure",
                dna_structure_text: "DNA is like a super long, tightly packed spaghetti noodle wrapping around histone \"spools\".",
                histones_metaphor: "Spools",
                histones_concept: "Histones",
                histones_text: "Histones are spools that DNA wraps around. They determine if genes are accessible.",
                acetylation_metaphor: "Opening the Curtains",
                acetylation_concept: "Acetylation",
                acetylation_text: "Acetylation relaxes the chromatin, allowing genes to be read.",
                methylation_metaphor: "Closing the Curtains",
                methylation_concept: "Methylation",
                methylation_text: "Methylation tightens the chromatin, silencing genes.",
                cityscape_metaphor: "Bustling City",
                cityscape_concept: "The Brain",
                cityscape_text: "Your brain is a bustling city with billions of neuron workers.",
                pfc_metaphor: "Chief Decision-Maker",
                pfc_concept: "Prefrontal Cortex",
                pfc_text: "The CEO of the brain city, handling big decisions and planning.",
                amygdala_metaphor: "Alarm System",
                amygdala_concept: "Amygdala",
                amygdala_text: "The city's alarm system, constantly scanning for danger.",
                stress_metaphor: "The Storm",
                stress_concept: "Chronic Stress",
                stress_text: "Stress is like a storm that weathers the city infrastructure.",
                therapy_metaphor: "Rewiring",
                therapy_concept: "Psychotherapy",
                therapy_text: "Therapy helps rewire the brain's emotional circuits.",
                label_environmental_stress: 'Environmental Stress',
                label_genetic_factors: 'Genetic Factors',
                label_community: 'Community',
                label_personal_growth: 'Personal Growth',
                label_medication: 'Medication',
                label_therapy: 'Therapy',
                label_ceo: 'CEO',
                alert_url_copied: 'Simulation URL copied to clipboard!',
                alert_url_fail: 'Failed to copy URL. Please copy it manually:',
                alert_fullscreen_error: 'Error attempting to enable full-screen mode',

                // 3D View
                '3d_view_title': '3D Neural Network View',
                'launch_3d': 'Launch 3D View',
                'hide_3d': 'Hide 3D View',
                'auto_rotate': 'Auto Rotate',
                'stop_rotate': 'Stop Rotation',
                'reset_camera': 'Reset Camera',
                'camera_x': 'Camera X Rotation',
                'camera_y': 'Camera Y Rotation',
                'camera_z': 'Camera Z Position',
                'fov': 'Field of View',

                // Neuro Animation
                "Synaptogenesis": "Synaptogenesis",
                "Neuron": "Neuron",
                "Connection": "Connection",
                "Fitness": "Fitness",
                "Generation": "Generation",

                // Genetic Animation
                "Chromosome": "Chromosome",
                "Gene": "Gene",
                "Trait": "Trait",
                "Neurotransmitter Response": "Neurotransmitter Response",
                "Excitatory": "Excitatory",
                "Inhibitory": "Inhibitory",
                "Inhibitorio": "Inhibitory",

                // Controls & Grid
                "Start Simulation": "Start Simulation",
                "Zoom": "Zoom",
                "Pan": "Pan",
                "Rotate": "Rotate",
                "X-Axis": "X-Axis",
                "Y-Axis": "Y-Axis",
                "Z-Axis": "Z-Axis",

                // Explanations
                "neuro_explanation_title": "Neuroplasticity Simulation",
                "neuro_explanation_text": "This simulation demonstrates how neurons form new connections (synaptogenesis) based on activity and efficiency. Red nodes represent neurons, and blue lines represent synaptic connections. The network evolves to optimize signal transmission.",
                "genetic_explanation_title": "Genetic Neural Evolution",
                "genetic_explanation_text": "This simulation visualizes how genetic traits influence neural network structure. 'Genes' determine connection weights, which dictate whether a neuron's response is excitatory (positive) or inhibitory (negative). The network evolves over generations to find the most effective configuration.",

                // Event Log
                "Synapse Created": "Synapse Created",
                "Weak Connection Pruned": "Weak Connection Pruned",
                "Generation Complete": "Generation Complete",
                "Best Fitness": "Best Fitness",
                "New Traits Evolved": "New Traits Evolved",
                "Elite Parents Preserved": "Elite Parents Preserved",

                // 3D Labels & Stats
                "Neurons": "Neurons",
                "Connections": "Connections",
                "Synapse View": "Synapse View",
                "Active Gene": "Active Gene",
                "Protein Structure": "Protein Structure",
                "Micro: Gene Structure": "Micro: Gene Structure",
                "Target: Brain Region": "Target: Brain Region",
                "Polypeptide Chain": "Polypeptide Chain",
                "Click PiP to select connection": "Click PiP to select connection",
                "Pause Evolution": "Pause Evolution",
                "Resume Evolution": "Resume Evolution",
                "Previous": "Previous",
                "Next": "Next",
                "Unknown": "Unknown",
                "Genotype (DNA)": "Genotype (DNA)",
                "Phenotype (Brain)": "Phenotype (Brain)",

                // Dopamine Model
                "ADHD": "ADHD",
                "Alpha-Synuclein": "Alpha-Synuclein",
                "Amphetamine": "Amphetamine",
                "Antipsychotic (Fast-off)": "Antipsychotic (Fast-off)",
                "Antipsychotic (Partial)": "Antipsychotic (Partial)",
                "Antipsychotic (Slow-off)": "Antipsychotic (Slow-off)",
                "Cocaine": "Cocaine",
                "Competitive": "Competitive",
                "D1R Signaling": "D1R Signaling",
                "D2R Signaling": "D2R Signaling",
                "High Stress": "High Stress",
                "L-DOPA Pulse": "L-DOPA Pulse",
                "MAOI Inhibitor": "MAOI Inhibitor",
                "Neuroinflammation": "Neuroinflammation",
                "Parkinsonian": "Parkinsonian",
                "Phasic Burst": "Phasic Burst",
                "Schizophrenia": "Schizophrenia",
                "Tonic Release": "Tonic Release",

                // Serotonin Model
                "5-HT1A": "5-HT1A",
                "5-HT1D": "5-HT1D",
                "5-HT2A": "5-HT2A",
                "5-HT3": "5-HT3",
                "5-HT4/7": "5-HT4/7",
                "SSRI": "SSRI",
                "Serotonin": "Serotonin",

                // RNA Model
                "Adenine (A)": "Adenine (A)",
                "Cytosine (C)": "Cytosine (C)",
                "Guanine (G)": "Guanine (G)",
                "Uracil (U)": "Uracil (U)",
                "Enzyme": "Enzyme",
                "Methylation": "Methylation",

                // Brain Regions
                "pfc": "Prefrontal Cortex",
                "parietalLobe": "Parietal Lobe",
                "occipitalLobe": "Occipital Lobe",
                "temporalLobe": "Temporal Lobe",
                "cerebellum": "Cerebellum",
                "brainstem": "Brainstem",
                "hippocampus": "Hippocampus",
                "amygdala": "Amygdala"
            },
            es: {
                // Consent Screen
                consent_title: "Explorando la Plasticidad Neuronal: Un Modelo de TCC y DBT",
                consent_desc: "Una simulación interactiva para ayudarte a visualizar cómo las prácticas terapéuticas pueden cambiar el cerebro.",
                disclaimer: "Nota: Esta es una simulación educativa, no una herramienta médica.",
                consent_check: "Reconozco que esta es una herramienta educativa y no un sustituto del consejo médico profesional.",
                launch_btn: "Iniciar Simulación",
                err_loading_models: "Error al cargar las descripciones de los modelos. Por favor, inténtelo de nuevo más tarde.",

                // Simulation Interface
                edu_banner: "Para Fines Educativos: Este modelo simula la actividad cerebral conceptual.",

                // Synapse Items
                label_vesicle: "Vesícula",
                label_receptor: "Receptor",
                label_neurotransmitter: "Neurotransmisor",
                label_ion_channel: "Canal Iónico",
                label_kinase: "Proteína Quinasa",
                label_rna: "ARNm",

                // Metrics
                metrics_title_synaptic: "Métricas en Tiempo Real (sinápticas)",
                metrics_title_network: "Métricas en Tiempo Real (red)",
                metric_weight: "Peso Sináptico",
                metric_neuro: "Neurotransmisores Liberados",
                metric_ions: "Iones Cruzados",
                metric_learning: "Métrica de Aprendizaje",

                // Controls
                controls_title_synaptic: "Controles de Simulación (sinápticos)",
                controls_title_network: "Controles de Simulación (red)",
                controls_title_environment: "Controles del Entorno",
                controls_title_general: "Controles Generales",

                label_intensity: "Intocidad de Práctica",
                label_speed: "Velocidad de Simulación",
                option_slow: "Lento",
                option_normal: "Normal",
                option_fast: "Rápido",

                btn_play: "Reproducir",
                btn_pause: "Pausa",
                btn_reset_plasticity: "Restablecer Plasticidad",

                label_stress: "Estrés Ambiental",
                label_support: "Nivel de Apoyo Social",
                label_genetic: "Factores Genéticos",
                btn_gene_a: "Gen A",
                btn_gene_b: "Gen B",

                btn_reset_sim: "Restablecer Simulación",
                btn_share: "Compartir Vista",
                btn_download: "Descargar Imagen",
                btn_dark_mode: "Modo Oscuro",
                btn_fullscreen: "Pantalla Completa",
                btn_language: "English", // Label to switch TO English

                // Shared Simulation Terms
                "signaling": "Señalización",
                "scenarios": "Escenarios",
                "pharmacology": "Farmacología",
                "settings": "Ajustes",
                "accessibility": "Accesibilidad",
                "aesthetics": "Estética",
                "feedback": "Retroalimentación",
                "temporal": "Temporal",
                "pause": "Pausa",
                "involved_regions": "Regiones Involucradas",
                "wellness_focus": "Enfoque de Bienestar",
                "clinical_relevance": "Relevancia Clínica",
                "initializing": "Inicializando...",
                "gen": "Gen",
                "fitness": "Aptitud",
                "best_fitness": "Mejor Aptitud",
                "used": "Usado",
                "ph": "pH",
                "temp": "Temp",
                "high_contrast": "Alto Contraste",
                "large_scale_ui": "IU de Gran Escala",
                "reduced_motion": "Movimiento Reducido",
                "mobile_interaction_hint": "ARRASTRAR para rotar • CLICK en regiones",
                "limbic_system": "Sistema Límbico",
                "active_theory": "Teoría Activa",
                "cerebral_cortex": "Corteza Cerebral",
                "active_enhancement": "Mejora Activa",
                "atp_consumed": "ATP Consumido",
                "genomic_integrity": "Integridad Genómica",
                "mutations": "Mutaciones",
                "successful_repairs": "Reparaciones Exitosas",
                "error_prone": "Propenso a Errores",
                "whole_brain_topology": "Topología Cerebral Completa",

                // Model Specific Titles
                "emotion_app_title": "Simulación de Emoción",
                "emotion_app_desc": "Explora las vías neurológicas y la regulación emocional.",
                "emotion_cat_philosophies": "Marcos Filosóficos",
                "emotion_phil_stoicism_name": "Estoicismo",
                "emotion_phil_buddhism_name": "Budismo",
                "emotion_phil_existentialism_name": "Existencialismo",
                "emotion_phil_taoism_name": "Taoísmo",
                "emotion_phil_nihilism_name": "Nihilismo",
                "emotion_phil_epicureanism_name": "Epicureísmo",
                "emotion_theory_gross_name": "Etapas del Modelo de Proceso de Gross",
                "emotion_theory_gross_desc": "Línea de tiempo interactiva de 5 pasos: Selección de situación -> Modificación -> Atención -> Valoración -> Respuesta.",
                "emotion_theory_polyvagal_name": "Polivagal \"Jerarquía de Respuesta\"",
                "emotion_theory_polyvagal_desc": "Estados codificados por colores: Compromiso social (Verde), Lucha/Huida (Amarillo), Congelación/Cierre (Rojo).",
                "emotion_reg_pfc_name": "Corteza Prefrontal",
                "emotion_reg_dlpfc_name": "PFC Dorsolateral",
                "emotion_reg_vmpfc_name": "PFC Ventromedial",
                "emotion_reg_ofc_name": "Corteza Orbitofrontal",
                "emotion_reg_amygdala_name": "Amígdala",
                "emotion_reg_hippocampus_name": "Hipocampo",
                "emotion_reg_hypothalamus_name": "Hipotálamo",
                "emotion_reg_thalamus_name": "Tálamo",
                "emotion_reg_brainstem_name": "Tronco Encefálico",
                "emotion_reg_insula_name": "Ínsula",
                "emotion_reg_acc_name": "Cíngulo Anterior",
                "emotion_reg_subacc_name": "ACC Subgenual",
                "emotion_reg_striatum_name": "Estriado",
                "emotion_reg_nac_name": "Núcleo Accumbens",
                "emotion_cat_regulations": "Regulación Emocional",
                "emotion_cat_therapeutic": "Efectos Terapéuticos",
                "emotion_cat_medication": "Tratamientos Médicos",
                "emotion_cat_advanced": "Teorías de Regulación",

                "cog_simulation": "Simulación de Cognición",
                "cog_select_desc": "Seleccione una teoría cognitiva para explorar su mapeo neurológico.",
                "cog_search_placeholder": "Buscar mejoras...",
                "cog_glass_brain": "Cerebro de Cristal",
                "cog_reset_view": "Restablecer Vista",
                "cog_model_title": "Modelo de Cognición",

                "neuro_dopamine_signaling": "Señalización de Dopamina",
                "neuro_dopamine_select": "Seleccione un modo para visualizar la vía.",
                "neuro_serotonin_title": "Modelo Estructural de Serotonina",
                "neuro_serotonin_desc": "Visualización de 5-HT1A en complejo con Gi.",

                "genetic_model_title": "Modelo Genético",
                "pathway_control": "Control de Vía",
                "systemic_pathway": "Vía Sistémica",
                "component_gene": "Componente/Gen",
                "highlight_pathway": "Resaltar Vía",
                "select_focus": "Seleccionar Foco...",

                "pip_dna": "Doble Hélice de ADN",
                "pip_micro": "Vista Micro",
                "pip_protein": "Vista de Proteína",
                "pip_target": "Vista de Objetivo",

                // DNA Repair Buttons
                "Base Excision": "Escisión de Base",
                "Mismatch Repair": "Reparación de Desajustes",
                "Nucleotide Excision": "Escisión de Nucleótidos",
                "Double-Strand Break": "Ruptura de Doble Cadena",
                "Replication": "Replicación",
                "Photolyase (Direct)": "Fotoliasa (Directa)",
                "MGMT Repair": "Reparación MGMT",
                "NHEJ (Error Prone)": "NHEJ (Propenso a Errores)",
                "Homologous Recomb": "Recomb. Homóloga",

                "Burst": "Explosión",
                "Idioma": "Idioma",

                how_to_title: "Cómo Usar",
                how_to_synaptic: "Usa los controles para ver cómo diferentes parámetros afectan la fuerza de las conexiones neuronales en tiempo real.",
                how_to_env: "Usa los deslizadores para ajustar el estrés ambiental y el apoyo social. Haz clic en los botones de genes para simular predisposiciones genéticas.",

                loading: "Cargando Simulación...",

                // Environment Canvas
                env_title: "Entorno de Salud Mental",
                env_subtitle: "Modelo Interactivo",
                legend_title: "Influencias",
                legend_family: "Familia",
                legend_society: "Sociedad",
                legend_community: "Comunidad",
                label_therapy: "Terapia",
                label_medication: "Medicación",

                // Config Labels
                "Environmental Stress": "Estrés Ambiental",
                "Genetic Factors": "Factores Genéticos",
                "Community": "Comunidad",
                "Personal Growth": "Crecimiento Personal",

                // Region Descriptions
                pfc_desc: "La Corteza Prefrontal es crucial para funciones ejecutivas como la planificación, toma de decisiones y regulación del comportamiento social.",
                amygdala_desc: "La Amígdala es central para procesar emociones, particularmente el miedo, y es una parte clave del sistema de detección de amenazas del cerebro.",
                hippocampus_desc: "El Hipocampo juega un papel mayor en el aprendizaje y la memoria, convirtiendo memorias de corto plazo en permanentes.",
                no_info: "No hay información disponible para esta región.",

                // Hovers
                activation_label: "Activación",

                // Regions Names
                "Prefrontal Cortex": "Corteza Prefrontal",
                "Amygdala": "Amígdala",
                "Hippocampus": "Hipocampo",

                // Brain Regions (Short Keys)
                "pfc": "Corteza Prefrontal",
                "parietalLobe": "Lóbulo Parietal",
                "occipitalLobe": "Lóbulo Occipital",
                "temporalLobe": "Lóbulo Temporal",
                "cerebellum": "Cerebelo",
                "brainstem": "Tronco Encefálico",
                "hippocampus": "Hipocampo",
                "amygdala": "Amígdala",

                // Region Descriptions (Missing in ES)
                parietalLobe_desc: "El lóbulo parietal procesa información sensorial sobre la ubicación de las partes del cuerpo, además de interpretar información visual y procesar el lenguaje y las matemáticas.",
                occipitalLobe_desc: "El lóbulo occipital es el centro de procesamiento visual del cerebro de los mamíferos y contiene la mayor parte de la región anatómica de la corteza visual.",
                temporalLobe_desc: "El lóbulo temporal participa en el procesamiento de la información sensorial para obtener significados derivados para la retención adecuada de la memoria visual, la comprensión del lenguaje y la asociación de emociones.",
                cerebellum_desc: "El cerebelo recibe información de los sistemas sensoriales, la médula espinal y otras partes del cerebro y luego regula los movimientos motores.",
                brainstem_desc: "El tronco encefálico controla el flujo de mensajes entre el cerebro y el resto del cuerpo, y también controla funciones corporales básicas como la respiración, la deglución, la frecuencia cardíaca, la presión arterial, la conciencia y si uno está despierto o somnoliento.",

                // Medication & Therapy Panels
                "Active Prescriptions": "Recetas Activas",
                "Recent Sessions": "Sesiones Recientes",
                "No active medications.": "No hay medicamentos activos.",
                "No recent sessions recorded.": "No hay sesiones recientes registradas.",
                "Loading...": "Cargando...",

                // Alerts & Prompts
                "Simulation URL copied to clipboard!": "¡URL de la simulación copiada al portapapeles!",
                "Failed to copy URL. Please copy it manually:\n": "No se pudo copiar la URL. Por favor, cópiela manualmente:\n",
                "Error attempting to enable full-screen mode: ": "Error al intentar activar el modo de pantalla completa: ",

                "Medication": "Medicación",

                // Hover descriptions for interactive elements
                "medication_desc": "Ver medicamentos activos y su información.",
                "therapy_desc": "Ver sesiones de terapia recientes y notas.",

                // Wellness Dimensions
                label_wellness_emotional: "Emocional",
                label_wellness_spiritual: "Espiritual",
                label_wellness_intellectual: "Intelectual",
                label_wellness_physical: "Físico",
                label_wellness_environmental: "Ambiental",
                label_wellness_financial: "Financiero",
                label_wellness_occupational: "Ocupacional",
                label_wellness_social: "Social",

                // Overlays
                dna_structure_metaphor: "Fideo de Espagueti",
                dna_structure_concept: "Estructura del ADN",
                dna_structure_text: "El ADN es como un fideo de espagueti súper largo y apretado que se envuelve alrededor de carretes de histonas.",
                histones_metaphor: "Carretes",
                histones_concept: "Histonas",
                histones_text: "Las histonas son carretes alrededor de los cuales se envuelve el ADN. Determinan si los genes son accesibles.",
                acetylation_metaphor: "Abriendo las Cortinas",
                acetylation_concept: "Acetilación",
                acetylation_text: "La acetilación relaja la cromatina, permitiendo que los genes sean leídos.",
                methylation_metaphor: "Cerrando las Cortinas",
                methylation_concept: "Metilación",
                methylation_text: "La metilación aprieta la cromatina, silenciando los genes.",
                cityscape_metaphor: "Ciudad Bulliciosa",
                cityscape_concept: "El Cerebro",
                cityscape_text: "Tu cerebro es una ciudad bulliciosa con miles de millones de trabajadores neuronales.",
                pfc_metaphor: "Jefe de Toma de Decisiones",
                pfc_concept: "Corteza Prefrontal",
                pfc_text: "El CEO de la ciudad cerebral, manejando grandes decisiones y planificación.",
                amygdala_metaphor: "Sistema de Alarma",
                amygdala_concept: "Amígdala",
                amygdala_text: "El sistema de alarma de la ciudad, escaneando constantemente en busca de peligro.",
                stress_metaphor: "La Tormenta",
                stress_concept: "Estrés Crónico",
                stress_text: "El estrés es como una tormenta que desgasta la infraestructura de la ciudad.",
                therapy_metaphor: "Recableado",
                therapy_concept: "Psicoterapia",
                therapy_text: "La terapia ayuda a recablear los circuitos emocionales del cerebro.",
                label_environmental_stress: "Estrés Ambiental",
                label_genetic_factors: "Factores Genéticos",
                label_community: "Comunidad",
                label_personal_growth: "Crecimiento Personal",
                label_medication: "Medicación",
                label_therapy: "Terapia",
                label_ceo: "CEO",
                alert_url_copied: "¡URL de simulación copiada al portapapeles!",
                alert_url_fail: "Error al copiar URL. Por favor cópielo manualmente:",
                alert_fullscreen_error: "Error al intentar habilitar el modo de pantalla completa",

                // 3D View
                '3d_view_title': 'Vista de Red Neuronal 3D',
                'launch_3d': 'Iniciar Vista 3D',
                'hide_3d': 'Ocultar Vista 3D',
                'auto_rotate': 'Rotación Automática',
                'stop_rotate': 'Detener Rotación',
                'reset_camera': 'Restablecer Cámara',
                'camera_x': 'Rotación X de Cámara',
                'camera_y': 'Rotación Y de Cámara',
                'camera_z': 'Posición Z de Cámara',
                'fov': 'Campo de Visión',

                // Neuro Animation
                "Synaptogenesis": "Sinaptogénesis",
                "Neuron": "Neurona",
                "Connection": "Conexión",
                "Fitness": "Aptitud",
                "Generation": "Generación",

                // Genetic Animation
                "Chromosome": "Cromosoma",
                "Gene": "Gen",
                "Trait": "Rasgo",
                "Neurotransmitter Response": "Respuesta de Neurotransmisor",
                "Excitatory": "Excitatorio",
                "Inhibitory": "Inhibitorio",
                "Inhibitorio": "Inhibitorio",

                // Controls & Grid
                "Start Simulation": "Iniciar Simulación",
                "Zoom": "Zoom",
                "Pan": "Pan",
                "Rotate": "Rotar",
                "X-Axis": "Eje X",
                "Y-Axis": "Eje Y",
                "Z-Axis": "Eje Z",

                // Explanations
                "neuro_explanation_title": "Simulación de Neuroplasticidad",
                "neuro_explanation_text": "Esta simulación demuestra cómo las neuronas forman nuevas conexiones (sinaptogénesis) basadas en la actividad y la eficiencia. Los nodos rojos representan neuronas y las líneas azules representan conexiones sinápticas. La red evoluciona para optimizar la transmisión de señales.",
                "genetic_explanation_title": "Evolución Neuronal Genética",
                "genetic_explanation_text": "Esta simulación visualiza cómo los rasgos genéticos influyen en la estructura de la red neuronal. Los 'genes' determinan los pesos de conexión, que dictan si la respuesta de una neurona es excitatoria (positiva) o inhibitoria (negativa). La red evoluciona a lo largo de generaciones para encontrar la configuración más efectiva.",

                // Event Log
                "Synapse Created": "Sinapsis Creada",
                "Weak Connection Pruned": "Conexión Débil Podada",
                "Generation Complete": "Generación Completa",
                "Best Fitness": "Mejor Aptitud",
                "New Traits Evolved": "Nuevos Rasgos Evolucionados",
                "Elite Parents Preserved": "Padres Élite Preservados",

                // 3D Labels & Stats
                "Neurons": "Neuronas",
                "Connections": "Conexiones",
                "Synapse View": "Vista de Sinapsis",
                "Active Gene": "Gen Activo",
                "Protein Structure": "Estructura de Proteína",
                "Micro: Gene Structure": "Micro: Estructura Génica",
                "Target: Brain Region": "Objetivo: Región Cerebral",
                "Polypeptide Chain": "Cadena Polipeptídica",
                "Click PiP to select connection": "Haga clic en PiP para seleccionar la conexión",
                "Pause Evolution": "Pausar Evolución",
                "Resume Evolution": "Reanudar Evolución",
                "Previous": "Anterior",
                "Next": "Siguiente",
                "Unknown": "Desconocido",
                "Genotype (DNA)": "Genotipo (ADN)",
                "Phenotype (Brain)": "Fenotipo (Cerebro)",

                // Dopamine Model
                "ADHD": "TDAH",
                "Alpha-Synuclein": "Alfa-Sinucleína",
                "Amphetamine": "Anfetamina",
                "Antipsychotic (Fast-off)": "Antipsicótico (Disociación rápida)",
                "Antipsychotic (Partial)": "Antipsicótico (Parcial)",
                "Antipsychotic (Slow-off)": "Antipsicótico (Disociación lenta)",
                "Cocaine": "Cocaína",
                "Competitive": "Competitivo",
                "D1R Signaling": "Señalización D1R",
                "D2R Signaling": "Señalización D2R",
                "High Stress": "Estrés Alto",
                "L-DOPA Pulse": "Pulso de L-DOPA",
                "MAOI Inhibitor": "Inhibidor de la MAO",
                "Neuroinflammation": "Neuroinflamación",
                "Parkinsonian": "Parkinsoniano",
                "Phasic Burst": "Ráfaga Fásica",
                "Schizophrenia": "Esquizofrenia",
                "Tonic Release": "Liberación Tónica",

                // Serotonin Model
                "5-HT1A": "5-HT1A",
                "5-HT1D": "5-HT1D",
                "5-HT2A": "5-HT2A",
                "5-HT3": "5-HT3",
                "5-HT4/7": "5-HT4/7",
                "SSRI": "ISRS",
                "Serotonin": "Serotonina",

                // RNA Model
                "Adenine (A)": "Adenina (A)",
                "Cytosine (C)": "Citosina (C)",
                "Guanine (G)": "Guanina (G)",
                "Uracil (U)": "Uracilo (U)",
                "Enzyme": "Enzima",
                "Methylation": "Metilación"
            }
        },
        GreenhouseComponent,
        GreenhouseSystem,
        GreenhouseAssetManager,

        createElement(tag, attributes, ...children) {
            const element = document.createElement(tag);
            for (const key in attributes) {
                if (key === 'className') {
                    element.className = attributes[key];
                } else {
                    element.setAttribute(key, attributes[key]);
                }
            }
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else {
                    element.appendChild(child);
                }
            });
            return element;
        },

        parseDynamicPath(pathString, context) {
            return pathString.replace(/\b(w|h|tw|psy)\b/g, match => context[match]);
        },

        t(key) {
            const lang = this.currentLanguage;
            // 1. Try direct key lookup in current language
            if (this.translations[lang] && this.translations[lang][key]) {
                return this.translations[lang][key];
            }
            // 2. Try direct key lookup in English (fallback)
            if (this.translations['en'] && this.translations['en'][key]) {
                return this.translations['en'][key];
            }

            // 3. If key is an English phrase (e.g. from config), try to find it in ES
            if (lang !== 'en') {
                return key;
            }

            return key;
        },

        setLanguage(lang) {
            if (this.translations[lang]) {
                this.currentLanguage = lang;
            }
        },

        toggleLanguage() {
            this.currentLanguage = this.currentLanguage === 'en' ? 'es' : 'en';
            window.dispatchEvent(new CustomEvent('greenhouseLanguageChanged', {
                detail: { language: this.currentLanguage }
            }));
            return this.currentLanguage;
        },

        getRegionDescription(regionKey) {
            const map = {
                pfc: 'pfc_desc',
                amygdala: 'amygdala_desc',
                hippocampus: 'hippocampus_desc',
                parietalLobe: 'parietalLobe_desc',
                occipitalLobe: 'occipitalLobe_desc',
                temporalLobe: 'temporalLobe_desc',
                cerebellum: 'cerebellum_desc',
                brainstem: 'brainstem_desc'
            };

            const key = map[regionKey] || 'no_info';
            return this.t(key);
        },

        wrapText(context, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
        }
    };

    window.GreenhouseModelsUtil = GreenhouseModelsUtil;
})();

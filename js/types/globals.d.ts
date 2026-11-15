/**
 * @file globals.d.ts
 * @description Global type definitions for the Greenhouse environment.
 */

declare interface Window {
    // Runtime globals published by independently loaded application scripts.
    _greenhouseGeneticAttributes: any;
    _greenhouseNeuroAttributes: any;
    Greenhouse: any;
    GreenhouseAppsScheduler: any;
    GreenhouseBrainMeshRealistic: any;
    GreenhouseCognitionAnalytics: any;
    GreenhouseCognitionApp: any;
    GreenhouseCognitionBrain: any;
    GreenhouseCognitionConfig: any;
    GreenhouseCognitionDevelopment: any;
    GreenhouseCognitionDrawingUtils: any;
    GreenhouseCognitionEducational: any;
    GreenhouseCognitionInterventions: any;
    GreenhouseCognitionMedications: any;
    GreenhouseCognitionResearch: any;
    GreenhouseCognitionTheories: any;
    GreenhouseDashboardApp: any;
    GreenhouseDNARepair: any;
    GreenhouseDNATooltip: any;
    GreenhouseDopamine: any;
    GreenhouseEmotionApp: any;
    GreenhouseEmotionBrain: any;
    GreenhouseEmotionConfig: any;
    GreenhouseEmotionDiagrams: any;
    GreenhouseGenetic: any;
    GreenhouseGeneticAlgo: any;
    GreenhouseGeneticBrain: any;
    GreenhouseGeneticCameraControls: any;
    GreenhouseGeneticChromosome: any;
    GreenhouseGeneticConfig: any;
    GreenhouseGeneticDNA: any;
    GreenhouseGeneticGene: any;
    GreenhouseGeneticGeometry: any;
    GreenhouseGeneticLighting: any;
    GreenhouseGeneticProtein: any;
    GreenhouseGeneticStats: any;
    GreenhouseGeneticUI3D: any;
    GreenhouseGraphParser: any;
    GreenhouseInflammationAnalysis: any;
    GreenhouseInflammationApp: any;
    GreenhouseInflammationConfig: any;
    GreenhouseInflammationControls: any;
    GreenhouseInflammationGeometry: any;
    GreenhouseInflammationMacro: any;
    GreenhouseInflammationMicro: any;
    GreenhouseInflammationMolecular: any;
    GreenhouseInflammationPathway: any;
    GreenhouseInflammationSignaling: any;
    GreenhouseInflammationTestHarness: any;
    GreenhouseInflammationTooltips: any;
    GreenhouseInflammationUI3D: any;
    GreenhouseInspiration: any;
    GreenhouseMobile: any;
    GreenhouseModelGraphViewer: any;
    GreenhouseModelsData: any;
    GreenhouseModelsTOC: any;
    GreenhouseModelsUI: any;
    GreenhouseNeuroCameraControls: any;
    GreenhousePathwayApp: any;
    GreenhousePathwayBrain: any;
    GreenhousePathwayCameraControls: any;
    GreenhousePathwayGeometry: any;
    GreenhousePathwayViewer: any;
    GreenhousePatientApp: any;
    GreenhouseQuizzes: any;
    GreenhouseReactCompatibility: any;
    GreenhouseRNATooltip: any;
    GreenhouseScheduler: any;
    GreenhouseSerotonin: any;
    GreenhouseStressConfig: any;
    GreenhouseStressControls: any;
    GreenhouseStressGeometry: any;
    GreenhouseStressMacro: any;
    GreenhouseStressPathway: any;
    GreenhouseStressPathwayButtons: any;
    GreenhouseStressSystemic: any;
    GreenhouseStressTooltips: any;
    GreenhouseStressUI3D: any;
    LabelingSystem: any;
    PathwayLayout: any;
    React: any;
    ReactomeParser: any;
    TechApp: any;
    V8GraphRenderer: any;
    // Utilities & Managers
    GreenhouseUtils: any;
    GreenhouseDependencyManager: any;
    GreenhouseBioStatus: any;
    GreenhouseModelsUtil: any;
    GreenhouseModels3DMath: any;
    GreenhouseTranslations: any;
    GreenhouseModelsUX: any;
    GreenhouseProfiler: any;

    // Testing Infrastructure
    assert: any;
    AssertionError: any;
    TestFramework: any;
    TestFrameworkClass: any;

    // State & Attributes
    renderingComplete: boolean;
    _greenhouseModelsAttributes: any;
    _greenhouseScriptAttributes: any;
    _greenhouseSynapseAttributes: {
        baseUrl?: string | null;
        targetSelector?: string | null;
    };
    GreenhouseSynapseApp: any;
    GreenhouseStressApp: any;

    // Models - Genetic
    GreenhouseGeneticCameraController: any;
    GreenhouseGeneticPiPControls: any;

    // Models - Neuro
    GreenhouseNeuroConfig: any;
    NeuroGA: any;
    GreenhouseNeuroApp: any;
    GreenhouseNeuroUI3D: any;
    GreenhouseNeuroControls: any;
    GreenhouseADHDData: any;
    NeuroSynapseCameraController: any;
    GreenhouseNeuroStats: any;
    GreenhouseNeuroBrain: any;
    GreenhouseNeuroGeometry: any;
    GreenhouseNeuroSynapse: any;

    // Infrastructure
    GreenhousePostProcessor: any;
}

declare var assert: any;
declare var global: any;
declare var require: any;
declare var module: any;

// Runtime ambient simulation globals
declare var GreenhouseModels3DMath: any;
declare var GreenhouseDNATooltip: any;
declare var GreenhouseGeneticLighting: any;
declare var GreenhouseADHDData: any;
declare var GreenhouseNeuroControls: any;
declare var GreenhouseNeuroUI3D: any;
declare var GreenhouseNeuroApp: any;
declare var GreenhouseNeuroConfig: any;
declare var GreenhouseNeuroStats: any;
declare var GreenhouseNeuroBrain: any;
declare var GreenhouseNeuroGeometry: any;
declare var GreenhouseNeuroSynapse: any;
declare var NeuroSynapseCameraController: any;
declare var GreenhouseGeneticCameraController: any;
declare var GreenhouseGeneticPiPControls: any;
declare var GreenhouseGeneticUI3D: any;
declare var GreenhouseGeneticStats: any;
declare var GreenhouseGeneticProtein: any;
declare var GreenhouseGeneticDNA: any;
declare var GreenhouseGeneticGene: any;
declare var GreenhouseGeneticGeometry: any;
declare var GreenhouseGeneticChromosome: any;
declare var GreenhouseGeneticBrain: any;
declare var GreenhouseGeneticCameraControls: any;
declare var GreenhouseGeneticAlgo: any;
declare var GreenhouseGeneticConfig: any;
declare var GreenhouseGenetic: any;
declare var GreenhousePathwayApp: any;
declare var GreenhousePathwayBrain: any;
declare var GreenhousePathwayCameraControls: any;
declare var GreenhousePathwayGeometry: any;
declare var GreenhousePathwayViewer: any;
declare var PathwayLayout: any;
declare var GreenhouseEmotionApp: any;
declare var GreenhouseEmotionBrain: any;
declare var GreenhouseEmotionConfig: any;
declare var GreenhouseEmotionDiagrams: any;
declare var GreenhouseCognitionAnalytics: any;
declare var GreenhouseCognitionApp: any;
declare var GreenhouseCognitionBrain: any;
declare var GreenhouseCognitionConfig: any;
declare var GreenhouseCognitionDevelopment: any;
declare var GreenhouseCognitionDrawingUtils: any;
declare var GreenhouseCognitionEducational: any;
declare var GreenhouseCognitionInterventions: any;
declare var GreenhouseCognitionMedications: any;
declare var GreenhouseCognitionResearch: any;
declare var GreenhouseCognitionTheories: any;
declare var GreenhouseModelsData: any;
declare var GreenhouseModelsTOC: any;
declare var GreenhouseModelsUI: any;
declare var GreenhouseModelsUtil: any;
declare var GreenhouseModelsUX: any;
declare var GreenhouseTranslations: any;
declare var GreenhouseBioStatus: any;
declare var GreenhouseDependencyManager: any;
declare var GreenhouseUtils: any;
declare var GreenhouseSerotonin: any;
declare var GreenhouseDopamine: any;
declare var GreenhouseDNARepair: any;
declare var GreenhousePatientApp: any;
declare var GreenhouseScheduler: any;
declare var GreenhouseDashboardApp: any;
declare var GreenhouseInspiration: any;
declare var GreenhouseMobile: any;
declare var GreenhouseModelGraphViewer: any;
declare var GreenhouseGraphParser: any;
declare var GreenhouseInflammationApp: any;
declare var GreenhouseInflammationConfig: any;
declare var GreenhouseInflammationControls: any;
declare var GreenhouseInflammationGeometry: any;
declare var GreenhouseInflammationMacro: any;
declare var GreenhouseInflammationMicro: any;
declare var GreenhouseInflammationMolecular: any;
declare var GreenhouseInflammationPathway: any;
declare var GreenhouseInflammationSignaling: any;
declare var GreenhouseInflammationTestHarness: any;
declare var GreenhouseInflammationTooltips: any;
declare var GreenhouseInflammationUI3D: any;
declare var GreenhouseInflammationAnalysis: any;
declare var GreenhouseBrainMeshRealistic: any;
declare var GreenhouseStressConfig: any;
declare var GreenhouseStressControls: any;
declare var GreenhouseStressGeometry: any;
declare var GreenhouseStressMacro: any;
declare var GreenhouseStressPathway: any;
declare var GreenhouseStressPathwayButtons: any;
declare var GreenhouseStressSystemic: any;
declare var GreenhouseStressTooltips: any;
declare var GreenhouseStressUI3D: any;
declare var GreenhouseStressApp: any;
declare var GreenhouseSynapseApp: any;
declare var LabelingSystem: any;
declare var ReactomeParser: any;
declare var TechApp: any;
declare var V8GraphRenderer: any;
declare var NeuroGA: any;
declare var AssertionError: any;
declare var TestFramework: any;

declare namespace Greenhouse {
    interface Point2D {
        x: number;
        y: number;
    }

    interface Point3D {
        x: number;
        y: number;
        z: number;
    }

    interface Camera {
        x: number;
        y: number;
        z: number;
        fov: number;
        rotationX?: number;
        rotationY?: number;
        rotationZ?: number;
    }

    interface Projection {
        width: number;
        height: number;
        near: number;
        far: number;
    }

    interface SimulationState {
        time: number;
        factors: Record<string, number>;
        metrics: Record<string, any>;
        flags: Record<string, boolean>;
        history: {
            cumulativeLoad: number;
            peakStress: number;
            treatmentCycles: number;
            burnoutEpochs: number;
        };
        seed: number;
    }
}

// Extend Performance for Memory Info
interface Performance {
    memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize?: number;
        jsHeapSizeLimit?: number;
    };
}

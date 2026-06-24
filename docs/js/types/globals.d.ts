/**
 * @file globals.d.ts
 * @description Global type definitions for the Greenhouse environment.
 */

declare interface Window {
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

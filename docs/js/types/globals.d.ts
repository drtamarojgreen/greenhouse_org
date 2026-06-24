/**
 * @file globals.d.ts
 * @description Global type definitions for the Greenhouse environment.
 */

declare interface Window {
    GreenhouseUtils: any;
    GreenhouseDependencyManager: any;
    GreenhouseBioStatus: any;
    GreenhouseModelsUtil: any;
    GreenhouseModels3DMath: any;
    GreenhouseTranslations: any;
    GreenhouseModelsUX: any;
    renderingComplete: boolean;
    _greenhouseModelsAttributes: any;
    _greenhouseScriptAttributes: any;
}

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

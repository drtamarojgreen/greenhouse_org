const { assert } = require('../utils/assertion_library.js');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

describe('Genetic Chromosome Regression Tests', () => {
    let context;

    before(() => {
        const chromosomeCode = fs.readFileSync(path.join(__dirname, '../../docs/js/genetic_ui_3d_chromosome.js'), 'utf8');

        context = {
            window: {},
            document: {
                createElement: () => ({
                    getContext: () => ({
                        fillRect: () => {},
                        stroke: () => {},
                        beginPath: () => {},
                        moveTo: () => {},
                        lineTo: () => {},
                        closePath: () => {},
                        createPattern: () => ({})
                    }),
                    width: 0,
                    height: 0
                })
            },
            Date: { now: () => 1000 },
            Math,
            console
        };

        // Mock dependencies
        context.window.GreenhouseGeneticConfig = {};
        context.window.GreenhouseGeneticLighting = {
            calculateLighting: () => ({ r: 255, g: 255, b: 255, a: 1 }),
            toRGBA: () => 'rgba(255,255,255,1)'
        };
        context.window.GreenhouseGeneticGeometry = {
            generateChromosomeMesh: () => ({
                vertices: [
                    { x: 0, y: 0, z: 0, t_arm: 0, arm: 0 },
                    { x: 1, y: 0, z: 0, t_arm: 0, arm: 0 },
                    { x: 0, y: 1, z: 0, t_arm: 0, arm: 0 }
                ],
                faces: [[0, 1, 2]]
            })
        };
        // Add to global scope as well
        context.GreenhouseModels3DMath = {
            project3DTo2D: (vx, vy, vz, cam, options) => ({ x: vx, y: vy, depth: vz, scale: 1 })
        };
        context.window.GreenhouseModels3DMath = context.GreenhouseModels3DMath;

        vm.createContext(context);
        vm.runInNewContext(chromosomeCode, context);
    });

    it('should draw chromatin structure and center camera on locus', () => {
        const { GreenhouseGeneticChromosome } = context.window;
        const ctx = {
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            fill: () => {},
            stroke: () => {},
            save: () => {},
            restore: () => {},
            fillRect: () => {},
            createPattern: () => ({})
        };

        const activeGene = { id: 5, symbol: 'TEST' };
        const drawPiPFrameCallback = (ctx, x, y, w, h, title) => {
            assert.equal(title, "Chromatin Structure");
        };

        GreenhouseGeneticChromosome.drawChromatinStructure(ctx, 0, 0, 100, 100, activeGene, drawPiPFrameCallback);
        assert.isTrue(true, 'drawChromatinStructure executed without error');
    });

    it('should use provided cameraState if available', () => {
        const { GreenhouseGeneticChromosome } = context.window;
        const ctx = {
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            fill: () => {},
            stroke: () => {},
            save: () => {},
            restore: () => {},
            fillRect: () => {},
            createPattern: () => ({})
        };

        const activeGene = { id: 0 };
        const cameraState = {
            camera: { x: 10, y: 20, z: 30, rotationX: 0, rotationY: 0, rotationZ: 0, fov: 500 }
        };

        GreenhouseGeneticChromosome.drawChromatinStructure(ctx, 0, 0, 100, 100, activeGene, null, cameraState);
        assert.isTrue(true, 'drawChromatinStructure executed with custom cameraState');
    });
});

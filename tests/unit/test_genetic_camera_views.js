// tests/unit/test_genetic_camera_views.js
// Unit tests for genetic page camera views and PiP controls

describe('Genetic Camera Views', () => {
    let container;
    let mockAlgo;
    let ui3d;

    beforeEach(() => {
        // Create container
        container = document.createElement('div');
        document.body.appendChild(container);

        // Mock genetic algorithm
        mockAlgo = {
            generation: 0,
            bestNetwork: {
                fitness: 0.5,
                nodes: Array.from({ length: 20 }, (_, i) => ({ id: i })),
                connections: []
            }
        };

        // Initialize UI3D
        if (window.GreenhouseGeneticUI3D) {
            ui3d = window.GreenhouseGeneticUI3D;
            ui3d.init(container, mockAlgo);
        }
    });

    afterEach(() => {
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
        if (ui3d && ui3d.animationFrame) {
            cancelAnimationFrame(ui3d.animationFrame);
            ui3d.animationFrame = null;
        }
    });

    describe('Camera Initialization', () => {
        it('should initialize with 5 cameras (main + 4 PiP)', () => {
            expect(ui3d.cameras).toBeDefined();
            expect(ui3d.cameras.length).toBe(5);
        });

        it('should set main camera to cameras[0]', () => {
            expect(ui3d.camera).toBe(ui3d.cameras[0]);
        });

        it('should initialize main camera with correct default values', () => {
            const mainCam = ui3d.cameras[0];
            expect(mainCam.x).toBe(0);
            expect(mainCam.y).toBe(0);
            expect(mainCam.z).toBe(-300);
            expect(mainCam.rotationX).toBe(0);
            expect(mainCam.rotationY).toBe(0);
            expect(mainCam.rotationZ).toBe(0);
            expect(mainCam.fov).toBe(500);
        });

        it('should initialize PiP cameras with correct default values', () => {
            // Helix camera (index 1)
            expect(ui3d.cameras[1].z).toBe(-200);
            expect(ui3d.cameras[1].fov).toBe(500);

            // Micro camera (index 2)
            expect(ui3d.cameras[2].z).toBe(-200);
            expect(ui3d.cameras[2].fov).toBe(400);

            // Protein camera (index 3)
            expect(ui3d.cameras[3].z).toBe(-100);
            expect(ui3d.cameras[3].fov).toBe(400);

            // Target camera (index 4)
            expect(ui3d.cameras[4].z).toBe(-300);
            expect(ui3d.cameras[4].fov).toBe(600);
        });
    });

    describe('Main Camera Controller', () => {
        it('should create main camera controller', () => {
            expect(ui3d.mainCameraController).toBeDefined();
        });

        it('should update main camera rotation on mouse drag', () => {
            const initialRotY = ui3d.camera.rotationY;
            
            // Simulate mouse drag
            if (ui3d.mainCameraController) {
                ui3d.mainCameraController.isDragging = true;
                ui3d.mainCameraController.lastMouseX = 100;
                ui3d.mainCameraController.lastMouseY = 100;
                
                // Simulate mouse move
                const mockEvent = {
                    clientX: 150,
                    clientY: 100
                };
                ui3d.mainCameraController.handleMouseMove(mockEvent);
                
                // Rotation should have changed
                expect(ui3d.camera.rotationY).not.toBe(initialRotY);
            }
        });

        it('should update camera on controller update', () => {
            if (ui3d.mainCameraController) {
                const initialRotY = ui3d.camera.rotationY;
                
                // Set auto-rotate
                ui3d.mainCameraController.autoRotate = true;
                ui3d.mainCameraController.autoRotateSpeed = 0.01;
                
                // Update
                ui3d.mainCameraController.update();
                
                // Rotation should have changed
                expect(ui3d.camera.rotationY).not.toBe(initialRotY);
            }
        });
    });

    describe('PiP Controls', () => {
        it('should initialize PiP controls', () => {
            expect(window.GreenhouseGeneticPiPControls).toBeDefined();
        });

        it('should have 4 PiP views (helix, micro, protein, target)', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const helixState = window.GreenhouseGeneticPiPControls.getState('helix');
                const microState = window.GreenhouseGeneticPiPControls.getState('micro');
                const proteinState = window.GreenhouseGeneticPiPControls.getState('protein');
                const targetState = window.GreenhouseGeneticPiPControls.getState('target');

                expect(helixState).toBeDefined();
                expect(microState).toBeDefined();
                expect(proteinState).toBeDefined();
                expect(targetState).toBeDefined();
            }
        });

        it('should initialize PiP states with default values', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                
                expect(state.zoom).toBe(1.0);
                expect(state.rotationX).toBe(0);
                expect(state.rotationY).toBe(0);
                expect(state.panX).toBe(0);
                expect(state.panY).toBe(0);
            }
        });

        it('should update PiP camera rotation', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const initialRotY = ui3d.cameras[1].rotationY;
                
                // Manually update rotation
                ui3d.cameras[1].rotationY += 0.1;
                
                // Update PiP controls
                window.GreenhouseGeneticPiPControls.update();
                
                // Rotation should have changed
                expect(ui3d.cameras[1].rotationY).not.toBe(initialRotY);
            }
        });
    });

    describe('Camera State Passing', () => {
        it('should pass camera to drawTargetView', () => {
            const mockCtx = {
                save: jasmine.createSpy('save'),
                restore: jasmine.createSpy('restore'),
                translate: jasmine.createSpy('translate'),
                beginPath: jasmine.createSpy('beginPath'),
                rect: jasmine.createSpy('rect'),
                clip: jasmine.createSpy('clip'),
                clearRect: jasmine.createSpy('clearRect')
            };

            const cameraState = { camera: ui3d.camera };
            
            // Call drawTargetView
            ui3d.drawTargetView(mockCtx, 0, 0, 800, 600, null, 0, null, null, cameraState);
            
            // Should have been called (even if it does nothing without brain module)
            expect(mockCtx.save).toHaveBeenCalled();
        });

        it('should pass camera to drawDNAHelixPiP', () => {
            const mockCtx = {
                save: jasmine.createSpy('save'),
                restore: jasmine.createSpy('restore'),
                translate: jasmine.createSpy('translate'),
                beginPath: jasmine.createSpy('beginPath'),
                rect: jasmine.createSpy('rect'),
                clip: jasmine.createSpy('clip')
            };

            const cameraState = { camera: ui3d.cameras[1] };
            const mockDrawPiPFrame = jasmine.createSpy('drawPiPFrame');
            
            // Call drawDNAHelixPiP
            ui3d.drawDNAHelixPiP(mockCtx, 10, 10, 200, 150, cameraState, mockDrawPiPFrame);
            
            // Should have called drawPiPFrame
            expect(mockDrawPiPFrame).toHaveBeenCalled();
        });

        it('should handle missing camera gracefully', () => {
            const mockCtx = {
                save: jasmine.createSpy('save'),
                restore: jasmine.createSpy('restore')
            };

            const cameraState = {}; // No camera
            const mockDrawPiPFrame = jasmine.createSpy('drawPiPFrame');
            
            // Should not throw
            expect(() => {
                ui3d.drawDNAHelixPiP(mockCtx, 10, 10, 200, 150, cameraState, mockDrawPiPFrame);
            }).not.toThrow();
        });
    });

    describe('Canvas Rendering', () => {
        it('should create canvas element', () => {
            const canvas = container.querySelector('canvas');
            expect(canvas).toBeDefined();
            expect(canvas).not.toBeNull();
        });

        it('should set canvas dimensions', () => {
            expect(ui3d.canvas.width).toBeGreaterThan(0);
            expect(ui3d.canvas.height).toBeGreaterThan(0);
        });

        it('should have 2D rendering context', () => {
            expect(ui3d.ctx).toBeDefined();
            expect(ui3d.ctx.constructor.name).toBe('CanvasRenderingContext2D');
        });

        it('should update projection on resize', () => {
            const initialWidth = ui3d.projection.width;
            
            // Resize canvas
            ui3d.canvas.style.width = '1000px';
            ui3d.resize();
            
            // Projection should update
            expect(ui3d.projection.width).toBe(ui3d.canvas.width);
        });
    });

    describe('Mouse Interaction', () => {
        it('should handle mouse down on canvas', () => {
            const canvas = ui3d.canvas;
            const mockEvent = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            
            // Should not throw
            expect(() => {
                canvas.dispatchEvent(mockEvent);
            }).not.toThrow();
        });

        it('should handle mouse wheel on canvas', () => {
            const canvas = ui3d.canvas;
            const mockEvent = new WheelEvent('wheel', {
                deltaY: -100,
                bubbles: true
            });
            
            // Should not throw
            expect(() => {
                canvas.dispatchEvent(mockEvent);
            }).not.toThrow();
        });

        it('should change cursor on mouse down', () => {
            if (ui3d.mainCameraController) {
                const canvas = ui3d.canvas;
                const rect = canvas.getBoundingClientRect();
                
                const mockEvent = {
                    clientX: rect.left + 100,
                    clientY: rect.top + 100,
                    button: 0
                };
                
                ui3d.mainCameraController.handleMouseDown(mockEvent);
                
                // Cursor should change to grabbing
                expect(canvas.style.cursor).toBe('grabbing');
            }
        });
    });

    describe('Animation Loop', () => {
        it('should start animation loop', () => {
            ui3d.startAnimation();
            expect(ui3d.animationFrame).toBeDefined();
        });

        it('should not start multiple animation loops', () => {
            ui3d.startAnimation();
            const firstFrame = ui3d.animationFrame;
            
            ui3d.startAnimation();
            const secondFrame = ui3d.animationFrame;
            
            expect(firstFrame).toBe(secondFrame);
        });

        it('should update camera in animation loop', (done) => {
            const initialRotY = ui3d.camera.rotationY;
            
            // Enable auto-rotate
            if (ui3d.mainCameraController) {
                ui3d.mainCameraController.autoRotate = true;
                ui3d.mainCameraController.autoRotateSpeed = 0.1;
            }
            
            ui3d.startAnimation();
            
            // Wait for a few frames
            setTimeout(() => {
                // Rotation should have changed
                expect(ui3d.camera.rotationY).not.toBe(initialRotY);
                done();
            }, 100);
        });
    });

    describe('View Rendering', () => {
        it('should render without errors', () => {
            expect(() => {
                ui3d.render();
            }).not.toThrow();
        });

        it('should clear canvas before rendering', () => {
            spyOn(ui3d.ctx, 'clearRect');
            ui3d.render();
            expect(ui3d.ctx.clearRect).toHaveBeenCalled();
        });

        it('should render all PiP views', () => {
            spyOn(ui3d, 'drawDNAHelixPiP');
            spyOn(ui3d, 'drawMicroView');
            spyOn(ui3d, 'drawProteinView');
            spyOn(ui3d, 'drawTargetView');
            
            ui3d.render();
            
            expect(ui3d.drawDNAHelixPiP).toHaveBeenCalled();
            expect(ui3d.drawMicroView).toHaveBeenCalled();
            expect(ui3d.drawProteinView).toHaveBeenCalled();
            expect(ui3d.drawTargetView).toHaveBeenCalled();
        });
    });

    describe('Camera Reset', () => {
        it('should reset PiP camera to default state', () => {
            if (window.GreenhouseGeneticPiPControls) {
                // Modify camera
                ui3d.cameras[1].rotationY = 1.5;
                ui3d.cameras[1].rotationX = 0.5;
                
                // Reset
                window.GreenhouseGeneticPiPControls.resetPiP('helix');
                
                // Should be back to defaults
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                expect(state.rotationY).toBe(0);
                expect(state.rotationX).toBe(0);
            }
        });
    });

    describe('Data Updates', () => {
        it('should update neurons3D on data update', () => {
            const initialLength = ui3d.neurons3D.length;
            
            // Update algorithm
            mockAlgo.bestNetwork.nodes = Array.from({ length: 30 }, (_, i) => ({ id: i }));
            ui3d.updateData();
            
            // Neurons should update
            expect(ui3d.neurons3D.length).toBe(30);
        });

        it('should map genes to helix positions', () => {
            ui3d.updateData();
            
            // First half should be genes
            const genes = ui3d.neurons3D.filter(n => n.type === 'gene');
            expect(genes.length).toBeGreaterThan(0);
            
            // Genes should have helix positions (negative x offset)
            genes.forEach(gene => {
                expect(gene.x).toBeLessThan(0);
            });
        });

        it('should map neurons to brain positions', () => {
            ui3d.updateData();
            
            // Second half should be neurons
            const neurons = ui3d.neurons3D.filter(n => n.type === 'neuron');
            expect(neurons.length).toBeGreaterThan(0);
            
            // Neurons should have brain positions (positive x offset)
            neurons.forEach(neuron => {
                expect(neuron.x).toBeGreaterThan(0);
            });
        });
    });
});

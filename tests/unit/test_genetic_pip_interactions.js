// tests/unit/test_genetic_pip_interactions.js
// Unit tests for PiP window interactions and controls

describe('Genetic PiP Interactions', () => {
    let container;
    let mockAlgo;
    let ui3d;
    let canvas;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);

        mockAlgo = {
            generation: 0,
            bestNetwork: {
                fitness: 0.5,
                nodes: Array.from({ length: 20 }, (_, i) => ({ id: i })),
                connections: []
            }
        };

        if (window.GreenhouseGeneticUI3D) {
            ui3d = window.GreenhouseGeneticUI3D;
            ui3d.init(container, mockAlgo);
            canvas = ui3d.canvas;
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

    describe('PiP Window Detection', () => {
        it('should detect mouse over helix PiP', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const rect = canvas.getBoundingClientRect();
                const pipX = 10;
                const pipY = 10;
                
                const mouseX = pipX + 50;
                const mouseY = pipY + 50;
                
                const isOver = window.GreenhouseGeneticPiPControls.isMouseOverPiP(
                    mouseX, mouseY, canvas.width, canvas.height
                );
                
                expect(isOver).toBeTruthy();
            }
        });

        it('should detect mouse over micro PiP', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const pipW = 200;
                const gap = 10;
                const rightPipX = canvas.width - pipW - gap;
                
                const mouseX = rightPipX + 50;
                const mouseY = 50;
                
                const isOver = window.GreenhouseGeneticPiPControls.isMouseOverPiP(
                    mouseX, mouseY, canvas.width, canvas.height
                );
                
                expect(isOver).toBeTruthy();
            }
        });

        it('should not detect mouse outside PiP windows', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const mouseX = canvas.width / 2;
                const mouseY = canvas.height / 2;
                
                const isOver = window.GreenhouseGeneticPiPControls.isMouseOverPiP(
                    mouseX, mouseY, canvas.width, canvas.height
                );
                
                expect(isOver).toBeFalsy();
            }
        });
    });

    describe('PiP Mouse Drag', () => {
        it('should handle mouse drag in helix PiP', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const initialRotY = ui3d.cameras[1].rotationY;
                
                // Simulate drag
                const mockEvent = {
                    clientX: 50,
                    clientY: 50,
                    button: 0
                };
                
                window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent, canvas);
                
                const moveEvent = {
                    clientX: 100,
                    clientY: 50
                };
                
                window.GreenhouseGeneticPiPControls.handleMouseMove(moveEvent);
                window.GreenhouseGeneticPiPControls.handleMouseUp();
                
                // Rotation should have changed
                expect(ui3d.cameras[1].rotationY).not.toBe(initialRotY);
            }
        });

        it('should handle right-click pan in PiP', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                const initialPanX = state.panX;
                
                // Simulate right-click drag
                const mockEvent = {
                    clientX: 50,
                    clientY: 50,
                    button: 2
                };
                
                window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent, canvas);
                
                const moveEvent = {
                    clientX: 100,
                    clientY: 50
                };
                
                window.GreenhouseGeneticPiPControls.handleMouseMove(moveEvent);
                window.GreenhouseGeneticPiPControls.handleMouseUp();
                
                const newState = window.GreenhouseGeneticPiPControls.getState('helix');
                expect(newState.panX).not.toBe(initialPanX);
            }
        });
    });

    describe('PiP Zoom', () => {
        it('should zoom in on wheel up', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                const initialZoom = state.zoom;
                
                const mockEvent = {
                    clientX: 50,
                    clientY: 50,
                    deltaY: -100,
                    preventDefault: () => {}
                };
                
                window.GreenhouseGeneticPiPControls.handleWheel(mockEvent, canvas);
                
                const newState = window.GreenhouseGeneticPiPControls.getState('helix');
                expect(newState.zoom).toBeGreaterThan(initialZoom);
            }
        });

        it('should zoom out on wheel down', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                const initialZoom = state.zoom;
                
                const mockEvent = {
                    clientX: 50,
                    clientY: 50,
                    deltaY: 100,
                    preventDefault: () => {}
                };
                
                window.GreenhouseGeneticPiPControls.handleWheel(mockEvent, canvas);
                
                const newState = window.GreenhouseGeneticPiPControls.getState('helix');
                expect(newState.zoom).toBeLessThan(initialZoom);
            }
        });

        it('should clamp zoom to min/max values', () => {
            if (window.GreenhouseGeneticPiPControls) {
                // Zoom way out
                for (let i = 0; i < 20; i++) {
                    const mockEvent = {
                        clientX: 50,
                        clientY: 50,
                        deltaY: 100,
                        preventDefault: () => {}
                    };
                    window.GreenhouseGeneticPiPControls.handleWheel(mockEvent, canvas);
                }
                
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                expect(state.zoom).toBeGreaterThanOrEqual(0.1);
                expect(state.zoom).toBeLessThanOrEqual(5.0);
            }
        });
    });

    describe('PiP Reset Button', () => {
        it('should detect reset button click', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const pipW = 200;
                const pipH = 150;
                const gap = 10;
                
                // Reset button is in top-right of PiP
                const resetX = gap + pipW - 25;
                const resetY = gap + 5;
                
                const pipName = window.GreenhouseGeneticPiPControls.checkResetButton(
                    resetX, resetY, canvas.width, canvas.height
                );
                
                expect(pipName).toBe('helix');
            }
        });

        it('should reset PiP state on reset button click', () => {
            if (window.GreenhouseGeneticPiPControls) {
                // Modify state
                ui3d.cameras[1].rotationY = 1.5;
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                state.zoom = 2.0;
                state.panX = 50;
                
                // Reset
                window.GreenhouseGeneticPiPControls.resetPiP('helix');
                
                const newState = window.GreenhouseGeneticPiPControls.getState('helix');
                expect(newState.zoom).toBe(1.0);
                expect(newState.panX).toBe(0);
                expect(ui3d.cameras[1].rotationY).toBe(0);
            }
        });
    });

    describe('PiP Control Icons', () => {
        it('should draw control icons for each PiP', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const mockCtx = {
                    save: jasmine.createSpy('save'),
                    restore: jasmine.createSpy('restore'),
                    fillStyle: '',
                    strokeStyle: '',
                    fillRect: jasmine.createSpy('fillRect'),
                    strokeRect: jasmine.createSpy('strokeRect'),
                    beginPath: jasmine.createSpy('beginPath'),
                    arc: jasmine.createSpy('arc'),
                    fill: jasmine.createSpy('fill'),
                    stroke: jasmine.createSpy('stroke')
                };
                
                window.GreenhouseGeneticPiPControls.drawControls(
                    mockCtx, 10, 10, 200, 150, 'helix'
                );
                
                expect(mockCtx.save).toHaveBeenCalled();
                expect(mockCtx.restore).toHaveBeenCalled();
            }
        });
    });

    describe('Multiple PiP Windows', () => {
        it('should handle interactions with different PiP windows independently', () => {
            if (window.GreenhouseGeneticPiPControls) {
                // Modify helix PiP
                ui3d.cameras[1].rotationY = 1.0;
                
                // Modify micro PiP
                ui3d.cameras[2].rotationY = 2.0;
                
                // Reset only helix
                window.GreenhouseGeneticPiPControls.resetPiP('helix');
                
                // Helix should be reset
                expect(ui3d.cameras[1].rotationY).toBe(0);
                
                // Micro should be unchanged
                expect(ui3d.cameras[2].rotationY).toBe(2.0);
            }
        });

        it('should track active PiP separately', () => {
            if (window.GreenhouseGeneticPiPControls) {
                // Click on helix PiP
                const mockEvent1 = {
                    clientX: 50,
                    clientY: 50,
                    button: 0
                };
                window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent1, canvas);
                
                const activePiP1 = window.GreenhouseGeneticPiPControls.activePiP;
                
                window.GreenhouseGeneticPiPControls.handleMouseUp();
                
                // Click on micro PiP
                const pipW = 200;
                const gap = 10;
                const rightPipX = canvas.width - pipW - gap;
                
                const mockEvent2 = {
                    clientX: rightPipX + 50,
                    clientY: 50,
                    button: 0
                };
                window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent2, canvas);
                
                const activePiP2 = window.GreenhouseGeneticPiPControls.activePiP;
                
                expect(activePiP1).not.toBe(activePiP2);
            }
        });
    });

    describe('PiP State Persistence', () => {
        it('should maintain PiP state across renders', () => {
            if (window.GreenhouseGeneticPiPControls) {
                // Set state
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                state.zoom = 1.5;
                state.rotationY = 0.5;
                
                // Render
                ui3d.render();
                
                // State should persist
                const newState = window.GreenhouseGeneticPiPControls.getState('helix');
                expect(newState.zoom).toBe(1.5);
                expect(newState.rotationY).toBe(0.5);
            }
        });

        it('should update camera from state', () => {
            if (window.GreenhouseGeneticPiPControls) {
                // Set state
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                state.rotationY = 1.0;
                
                // Update
                window.GreenhouseGeneticPiPControls.update();
                
                // Camera should reflect state
                expect(ui3d.cameras[1].rotationY).toBe(1.0);
            }
        });
    });

    describe('PiP Auto-Rotation', () => {
        it('should support auto-rotation in PiP', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const initialRotY = ui3d.cameras[1].rotationY;
                
                // Enable auto-rotate
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                state.autoRotate = true;
                state.autoRotateSpeed = 0.1;
                
                // Update multiple times
                for (let i = 0; i < 10; i++) {
                    window.GreenhouseGeneticPiPControls.update();
                }
                
                // Rotation should have changed
                expect(ui3d.cameras[1].rotationY).not.toBe(initialRotY);
            }
        });

        it('should disable auto-rotation on manual interaction', () => {
            if (window.GreenhouseGeneticPiPControls) {
                // Enable auto-rotate
                const state = window.GreenhouseGeneticPiPControls.getState('helix');
                state.autoRotate = true;
                
                // Simulate manual drag
                const mockEvent = {
                    clientX: 50,
                    clientY: 50,
                    button: 0
                };
                window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent, canvas);
                
                // Auto-rotate should be disabled
                const newState = window.GreenhouseGeneticPiPControls.getState('helix');
                expect(newState.autoRotate).toBe(false);
            }
        });
    });

    describe('PiP Coordinate Transformation', () => {
        it('should transform mouse coordinates to PiP space', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const pipX = 10;
                const pipY = 10;
                const pipW = 200;
                const pipH = 150;
                
                const mouseX = pipX + 100;
                const mouseY = pipY + 75;
                
                const localX = mouseX - pipX;
                const localY = mouseY - pipY;
                
                expect(localX).toBe(100);
                expect(localY).toBe(75);
                expect(localX).toBeLessThan(pipW);
                expect(localY).toBeLessThan(pipH);
            }
        });
    });

    describe('PiP Clipping', () => {
        it('should clip content to PiP bounds', () => {
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
            
            ui3d.drawDNAHelixPiP(mockCtx, 10, 10, 200, 150, cameraState, mockDrawPiPFrame);
            
            expect(mockCtx.clip).toHaveBeenCalled();
        });
    });

    describe('PiP Focus Management', () => {
        it('should track which PiP has focus', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const mockEvent = {
                    clientX: 50,
                    clientY: 50,
                    button: 0
                };
                
                window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent, canvas);
                
                expect(window.GreenhouseGeneticPiPControls.activePiP).toBeDefined();
            }
        });

        it('should clear focus on mouse up', () => {
            if (window.GreenhouseGeneticPiPControls) {
                const mockEvent = {
                    clientX: 50,
                    clientY: 50,
                    button: 0
                };
                
                window.GreenhouseGeneticPiPControls.handleMouseDown(mockEvent, canvas);
                window.GreenhouseGeneticPiPControls.handleMouseUp();
                
                expect(window.GreenhouseGeneticPiPControls.activePiP).toBeNull();
            }
        });
    });
});

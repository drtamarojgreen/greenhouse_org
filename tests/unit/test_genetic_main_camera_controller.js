// tests/unit/test_genetic_main_camera_controller.js
// Unit tests for main camera controller functionality

describe('Genetic Main Camera Controller', () => {
    let container;
    let mockAlgo;
    let ui3d;
    let controller;
    let camera;

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
            controller = ui3d.mainCameraController;
            camera = ui3d.camera;
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

    describe('Controller Initialization', () => {
        it('should create controller instance', () => {
            expect(controller).toBeDefined();
            expect(controller).not.toBeNull();
        });

        it('should reference the main camera', () => {
            if (controller) {
                expect(controller.camera).toBe(camera);
            }
        });

        it('should initialize with default settings', () => {
            if (controller) {
                expect(controller.isDragging).toBe(false);
                expect(controller.isPanning).toBe(false);
                expect(controller.isListening).toBe(true);
            }
        });

        it('should have sensitivity settings', () => {
            if (controller) {
                expect(controller.rotationSensitivity).toBeDefined();
                expect(controller.zoomSensitivity).toBeDefined();
                expect(controller.panSensitivity).toBeDefined();
            }
        });
    });

    describe('Mouse Drag Rotation', () => {
        it('should start dragging on mouse down', () => {
            if (controller) {
                const mockEvent = {
                    clientX: 100,
                    clientY: 100,
                    button: 0
                };
                
                controller.handleMouseDown(mockEvent);
                
                expect(controller.isDragging).toBe(true);
                expect(controller.lastMouseX).toBe(100);
                expect(controller.lastMouseY).toBe(100);
            }
        });

        it('should rotate camera on mouse move while dragging', () => {
            if (controller) {
                const initialRotY = camera.rotationY;
                
                controller.isDragging = true;
                controller.lastMouseX = 100;
                controller.lastMouseY = 100;
                
                const mockEvent = {
                    clientX: 150,
                    clientY: 100
                };
                
                controller.handleMouseMove(mockEvent);
                
                expect(camera.rotationY).not.toBe(initialRotY);
            }
        });

        it('should stop dragging on mouse up', () => {
            if (controller) {
                controller.isDragging = true;
                controller.handleMouseUp();
                
                expect(controller.isDragging).toBe(false);
            }
        });

        it('should update rotation based on mouse delta', () => {
            if (controller) {
                const initialRotY = camera.rotationY;
                
                controller.isDragging = true;
                controller.lastMouseX = 100;
                controller.lastMouseY = 100;
                
                // Large horizontal movement
                const mockEvent = {
                    clientX: 200,
                    clientY: 100
                };
                
                controller.handleMouseMove(mockEvent);
                
                const deltaRot = Math.abs(camera.rotationY - initialRotY);
                expect(deltaRot).toBeGreaterThan(0);
            }
        });
    });

    describe('Right-Click Panning', () => {
        it('should start panning on right mouse button', () => {
            if (controller) {
                const mockEvent = {
                    clientX: 100,
                    clientY: 100,
                    button: 2
                };
                
                controller.handleMouseDown(mockEvent);
                
                expect(controller.isPanning).toBe(true);
            }
        });

        it('should pan camera on mouse move while panning', () => {
            if (controller) {
                const initialX = camera.x;
                const initialY = camera.y;
                
                controller.isPanning = true;
                controller.lastMouseX = 100;
                controller.lastMouseY = 100;
                
                const mockEvent = {
                    clientX: 150,
                    clientY: 150
                };
                
                controller.handleMouseMove(mockEvent);
                
                expect(camera.x !== initialX || camera.y !== initialY).toBe(true);
            }
        });

        it('should stop panning on mouse up', () => {
            if (controller) {
                controller.isPanning = true;
                controller.handleMouseUp();
                
                expect(controller.isPanning).toBe(false);
            }
        });
    });

    describe('Mouse Wheel Zoom', () => {
        it('should zoom in on wheel up', () => {
            if (controller) {
                const initialZ = camera.z;
                
                const mockEvent = {
                    deltaY: -100,
                    preventDefault: () => {}
                };
                
                controller.handleWheel(mockEvent);
                
                expect(camera.z).toBeGreaterThan(initialZ);
            }
        });

        it('should zoom out on wheel down', () => {
            if (controller) {
                const initialZ = camera.z;
                
                const mockEvent = {
                    deltaY: 100,
                    preventDefault: () => {}
                };
                
                controller.handleWheel(mockEvent);
                
                expect(camera.z).toBeLessThan(initialZ);
            }
        });

        it('should clamp zoom to min/max bounds', () => {
            if (controller) {
                // Zoom way in
                for (let i = 0; i < 50; i++) {
                    const mockEvent = {
                        deltaY: -100,
                        preventDefault: () => {}
                    };
                    controller.handleWheel(mockEvent);
                }
                
                expect(camera.z).toBeGreaterThanOrEqual(-1000);
                
                // Zoom way out
                for (let i = 0; i < 100; i++) {
                    const mockEvent = {
                        deltaY: 100,
                        preventDefault: () => {}
                    };
                    controller.handleWheel(mockEvent);
                }
                
                expect(camera.z).toBeLessThanOrEqual(-50);
            }
        });
    });

    describe('Keyboard Controls', () => {
        it('should handle arrow key rotation', () => {
            if (controller) {
                const initialRotY = camera.rotationY;
                
                const mockEvent = {
                    key: 'ArrowLeft',
                    preventDefault: () => {}
                };
                
                controller.handleKeyDown(mockEvent);
                controller.update();
                
                expect(camera.rotationY).not.toBe(initialRotY);
            }
        });

        it('should handle WASD movement', () => {
            if (controller) {
                const initialX = camera.x;
                
                const mockEvent = {
                    key: 'a',
                    preventDefault: () => {}
                };
                
                controller.handleKeyDown(mockEvent);
                controller.update();
                
                expect(camera.x).not.toBe(initialX);
            }
        });

        it('should stop movement on key up', () => {
            if (controller) {
                const mockDownEvent = {
                    key: 'w',
                    preventDefault: () => {}
                };
                
                controller.handleKeyDown(mockDownEvent);
                
                const mockUpEvent = {
                    key: 'w'
                };
                
                controller.handleKeyUp(mockUpEvent);
                
                // Movement should stop
                expect(controller.keys).toBeDefined();
                if (controller.keys) {
                    expect(controller.keys['w']).toBe(false);
                }
            }
        });
    });

    describe('Auto-Rotation', () => {
        it('should support auto-rotation', () => {
            if (controller) {
                const initialRotY = camera.rotationY;
                
                controller.autoRotate = true;
                controller.autoRotateSpeed = 0.1;
                
                controller.update();
                
                expect(camera.rotationY).not.toBe(initialRotY);
            }
        });

        it('should disable auto-rotation on manual interaction', () => {
            if (controller) {
                controller.autoRotate = true;
                
                const mockEvent = {
                    clientX: 100,
                    clientY: 100,
                    button: 0
                };
                
                controller.handleMouseDown(mockEvent);
                
                expect(controller.autoRotate).toBe(false);
            }
        });

        it('should adjust auto-rotation speed', () => {
            if (controller) {
                controller.autoRotate = true;
                controller.autoRotateSpeed = 0.5;
                
                const initialRotY = camera.rotationY;
                controller.update();
                const delta1 = Math.abs(camera.rotationY - initialRotY);
                
                camera.rotationY = initialRotY;
                controller.autoRotateSpeed = 0.1;
                controller.update();
                const delta2 = Math.abs(camera.rotationY - initialRotY);
                
                expect(delta1).toBeGreaterThan(delta2);
            }
        });
    });

    describe('Camera Smoothing', () => {
        it('should smooth camera movements', () => {
            if (controller && controller.smoothing) {
                const targetRotY = camera.rotationY + 1.0;
                controller.targetRotationY = targetRotY;
                
                // Update multiple times
                for (let i = 0; i < 5; i++) {
                    controller.update();
                }
                
                // Should be moving towards target but not there yet
                expect(camera.rotationY).not.toBe(targetRotY);
                expect(Math.abs(camera.rotationY - targetRotY)).toBeLessThan(1.0);
            }
        });
    });

    describe('Fly-To Animation', () => {
        it('should support fly-to target', () => {
            if (controller && controller.flyTo) {
                const target = {
                    x: 100,
                    y: 100,
                    z: -200,
                    rotationX: 0.5,
                    rotationY: 1.0
                };
                
                controller.flyTo(target, 1000);
                
                expect(controller.isFlying).toBe(true);
            }
        });

        it('should animate to target position', (done) => {
            if (controller && controller.flyTo) {
                const initialX = camera.x;
                const target = {
                    x: 100,
                    y: 0,
                    z: camera.z,
                    rotationX: camera.rotationX,
                    rotationY: camera.rotationY
                };
                
                controller.flyTo(target, 100);
                
                setTimeout(() => {
                    controller.update();
                    expect(camera.x).not.toBe(initialX);
                    done();
                }, 50);
            } else {
                done();
            }
        });
    });

    describe('Camera Constraints', () => {
        it('should constrain rotation X to valid range', () => {
            if (controller) {
                camera.rotationX = Math.PI;
                controller.update();
                
                expect(camera.rotationX).toBeLessThanOrEqual(Math.PI / 2);
                expect(camera.rotationX).toBeGreaterThanOrEqual(-Math.PI / 2);
            }
        });

        it('should wrap rotation Y around 2π', () => {
            if (controller) {
                camera.rotationY = Math.PI * 3;
                controller.update();
                
                expect(camera.rotationY).toBeLessThan(Math.PI * 2);
            }
        });
    });

    describe('Sensitivity Settings', () => {
        it('should adjust rotation sensitivity', () => {
            if (controller) {
                const initialRotY = camera.rotationY;
                
                controller.rotationSensitivity = 0.01;
                controller.isDragging = true;
                controller.lastMouseX = 100;
                controller.lastMouseY = 100;
                
                const mockEvent = {
                    clientX: 200,
                    clientY: 100
                };
                
                controller.handleMouseMove(mockEvent);
                const delta1 = Math.abs(camera.rotationY - initialRotY);
                
                // Reset and try with higher sensitivity
                camera.rotationY = initialRotY;
                controller.rotationSensitivity = 0.1;
                controller.lastMouseX = 100;
                
                controller.handleMouseMove(mockEvent);
                const delta2 = Math.abs(camera.rotationY - initialRotY);
                
                expect(delta2).toBeGreaterThan(delta1);
            }
        });

        it('should adjust zoom sensitivity', () => {
            if (controller) {
                const initialZ = camera.z;
                
                controller.zoomSensitivity = 0.1;
                const mockEvent = {
                    deltaY: -100,
                    preventDefault: () => {}
                };
                controller.handleWheel(mockEvent);
                const delta1 = Math.abs(camera.z - initialZ);
                
                // Reset and try with higher sensitivity
                camera.z = initialZ;
                controller.zoomSensitivity = 1.0;
                controller.handleWheel(mockEvent);
                const delta2 = Math.abs(camera.z - initialZ);
                
                expect(delta2).toBeGreaterThan(delta1);
            }
        });
    });

    describe('Controller State', () => {
        it('should track listening state', () => {
            if (controller) {
                expect(controller.isListening).toBe(true);
                
                controller.isListening = false;
                
                // Should not respond to input
                const mockEvent = {
                    clientX: 100,
                    clientY: 100,
                    button: 0
                };
                
                controller.handleMouseDown(mockEvent);
                
                expect(controller.isDragging).toBe(false);
            }
        });

        it('should enable/disable controller', () => {
            if (controller) {
                controller.isListening = false;
                
                const initialRotY = camera.rotationY;
                
                const mockEvent = {
                    clientX: 100,
                    clientY: 100,
                    button: 0
                };
                
                controller.handleMouseDown(mockEvent);
                
                const moveEvent = {
                    clientX: 200,
                    clientY: 100
                };
                
                controller.handleMouseMove(moveEvent);
                
                // Should not have changed
                expect(camera.rotationY).toBe(initialRotY);
            }
        });
    });

    describe('Update Loop', () => {
        it('should update camera state', () => {
            if (controller) {
                controller.autoRotate = true;
                controller.autoRotateSpeed = 0.1;
                
                const initialRotY = camera.rotationY;
                
                controller.update();
                
                expect(camera.rotationY).not.toBe(initialRotY);
            }
        });

        it('should handle multiple updates', () => {
            if (controller) {
                controller.autoRotate = true;
                controller.autoRotateSpeed = 0.05;
                
                const initialRotY = camera.rotationY;
                
                for (let i = 0; i < 10; i++) {
                    controller.update();
                }
                
                const deltaRot = Math.abs(camera.rotationY - initialRotY);
                expect(deltaRot).toBeGreaterThan(0.4);
            }
        });
    });

    describe('Camera Reset', () => {
        it('should reset camera to default position', () => {
            if (controller && controller.reset) {
                camera.x = 100;
                camera.y = 100;
                camera.z = -100;
                camera.rotationX = 1.0;
                camera.rotationY = 2.0;
                
                controller.reset();
                
                expect(camera.x).toBe(0);
                expect(camera.y).toBe(0);
                expect(camera.z).toBe(-300);
                expect(camera.rotationX).toBe(0);
                expect(camera.rotationY).toBe(0);
            }
        });
    });

    describe('Inertia/Momentum', () => {
        it('should support momentum on drag release', () => {
            if (controller && controller.momentum) {
                controller.isDragging = true;
                controller.lastMouseX = 100;
                controller.lastMouseY = 100;
                
                // Fast drag
                const mockEvent = {
                    clientX: 300,
                    clientY: 100
                };
                
                controller.handleMouseMove(mockEvent);
                controller.handleMouseUp();
                
                const initialRotY = camera.rotationY;
                
                // Update a few times
                for (let i = 0; i < 5; i++) {
                    controller.update();
                }
                
                // Should continue rotating
                expect(camera.rotationY).not.toBe(initialRotY);
            }
        });
    });

    describe('Touch Support', () => {
        it('should handle touch events', () => {
            if (controller && controller.handleTouchStart) {
                const mockEvent = {
                    touches: [{
                        clientX: 100,
                        clientY: 100
                    }],
                    preventDefault: () => {}
                };
                
                expect(() => {
                    controller.handleTouchStart(mockEvent);
                }).not.toThrow();
            }
        });
    });

    describe('Configuration', () => {
        it('should load settings from config', () => {
            if (controller && window.GreenhouseGeneticConfig) {
                const config = window.GreenhouseGeneticConfig;
                
                const rotSens = config.get('camera.rotationSensitivity');
                if (rotSens !== undefined) {
                    expect(controller.rotationSensitivity).toBe(rotSens);
                }
            }
        });

        it('should update settings dynamically', () => {
            if (controller) {
                const newSensitivity = 0.05;
                controller.rotationSensitivity = newSensitivity;
                
                expect(controller.rotationSensitivity).toBe(newSensitivity);
            }
        });
    });
});

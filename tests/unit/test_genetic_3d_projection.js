// tests/unit/test_genetic_3d_projection.js
// Unit tests for 3D projection and rendering math

describe('Genetic 3D Projection', () => {
    let container;
    let mockAlgo;
    let ui3d;
    let camera;
    let projection;

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
            camera = ui3d.camera;
            projection = ui3d.projection;
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

    describe('Projection Setup', () => {
        it('should initialize projection parameters', () => {
            expect(projection).toBeDefined();
            expect(projection.width).toBeGreaterThan(0);
            expect(projection.height).toBeGreaterThan(0);
        });

        it('should have near and far clipping planes', () => {
            expect(projection.near).toBeDefined();
            expect(projection.far).toBeDefined();
            expect(projection.far).toBeGreaterThan(projection.near);
        });

        it('should update projection on canvas resize', () => {
            const initialWidth = projection.width;
            
            ui3d.canvas.style.width = '1000px';
            ui3d.resize();
            
            expect(projection.width).not.toBe(initialWidth);
        });
    });

    describe('3D to 2D Projection', () => {
        it('should project 3D point to 2D screen space', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: 0 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected).toBeDefined();
                expect(projected.x).toBeDefined();
                expect(projected.y).toBeDefined();
                expect(projected.scale).toBeDefined();
            }
        });

        it('should handle points in front of camera', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: -100 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected.scale).toBeGreaterThan(0);
            }
        });

        it('should handle points behind camera', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: 100 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected.scale).toBeLessThanOrEqual(0);
            }
        });

        it('should scale based on distance', () => {
            if (window.GreenhouseModels3DMath) {
                const near = { x: 0, y: 0, z: -100 };
                const far = { x: 0, y: 0, z: -500 };
                
                const projNear = window.GreenhouseModels3DMath.project3DTo2D(
                    near.x, near.y, near.z, camera, projection
                );
                const projFar = window.GreenhouseModels3DMath.project3DTo2D(
                    far.x, far.y, far.z, camera, projection
                );
                
                expect(projNear.scale).toBeGreaterThan(projFar.scale);
            }
        });

        it('should project to screen center for origin point', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: -200 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                const centerX = projection.width / 2;
                const centerY = projection.height / 2;
                
                expect(Math.abs(projected.x - centerX)).toBeLessThan(10);
                expect(Math.abs(projected.y - centerY)).toBeLessThan(10);
            }
        });
    });

    describe('Camera Rotation', () => {
        it('should apply rotation to projected points', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 100, y: 0, z: -200 };
                
                camera.rotationY = 0;
                const proj1 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                camera.rotationY = Math.PI / 4;
                const proj2 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(proj1.x).not.toBe(proj2.x);
            }
        });

        it('should handle full 360 degree rotation', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 100, y: 0, z: -200 };
                
                camera.rotationY = 0;
                const proj1 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                camera.rotationY = Math.PI * 2;
                const proj2 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(Math.abs(proj1.x - proj2.x)).toBeLessThan(1);
                expect(Math.abs(proj1.y - proj2.y)).toBeLessThan(1);
            }
        });
    });

    describe('Depth Sorting', () => {
        it('should calculate depth for sorting', () => {
            if (window.GreenhouseModels3DMath) {
                const point1 = { x: 0, y: 0, z: -100 };
                const point2 = { x: 0, y: 0, z: -500 };
                
                const proj1 = window.GreenhouseModels3DMath.project3DTo2D(
                    point1.x, point1.y, point1.z, camera, projection
                );
                const proj2 = window.GreenhouseModels3DMath.project3DTo2D(
                    point2.x, point2.y, point2.z, camera, projection
                );
                
                expect(proj1.depth).toBeDefined();
                expect(proj2.depth).toBeDefined();
                expect(proj1.depth).toBeLessThan(proj2.depth);
            }
        });

        it('should sort objects by depth', () => {
            const objects = [
                { x: 0, y: 0, z: -500, id: 'far' },
                { x: 0, y: 0, z: -100, id: 'near' },
                { x: 0, y: 0, z: -300, id: 'mid' }
            ];
            
            if (window.GreenhouseModels3DMath) {
                const projected = objects.map(obj => ({
                    ...obj,
                    ...window.GreenhouseModels3DMath.project3DTo2D(
                        obj.x, obj.y, obj.z, camera, projection
                    )
                }));
                
                projected.sort((a, b) => b.depth - a.depth);
                
                expect(projected[0].id).toBe('far');
                expect(projected[1].id).toBe('mid');
                expect(projected[2].id).toBe('near');
            }
        });
    });

    describe('Field of View', () => {
        it('should use camera FOV for projection', () => {
            expect(camera.fov).toBeDefined();
            expect(camera.fov).toBeGreaterThan(0);
        });

        it('should affect projection scale', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 100, y: 0, z: -200 };
                
                camera.fov = 300;
                const proj1 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                camera.fov = 700;
                const proj2 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(proj1.scale).not.toBe(proj2.scale);
            }
        });
    });

    describe('Clipping', () => {
        it('should clip points outside near plane', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: camera.z + 5 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected.scale).toBeLessThanOrEqual(0);
            }
        });

        it('should handle points at far plane', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: camera.z - 2000 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected).toBeDefined();
            }
        });
    });

    describe('Screen Space Coordinates', () => {
        it('should map to canvas coordinates', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: -200 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected.x).toBeGreaterThanOrEqual(0);
                expect(projected.x).toBeLessThanOrEqual(projection.width);
                expect(projected.y).toBeGreaterThanOrEqual(0);
                expect(projected.y).toBeLessThanOrEqual(projection.height);
            }
        });

        it('should handle off-screen points', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 10000, y: 0, z: -200 };
                const projected = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(projected).toBeDefined();
                expect(projected.x).toBeGreaterThan(projection.width);
            }
        });
    });

    describe('Perspective Correction', () => {
        it('should apply perspective division', () => {
            if (window.GreenhouseModels3DMath) {
                const near = { x: 100, y: 100, z: -100 };
                const far = { x: 100, y: 100, z: -500 };
                
                const projNear = window.GreenhouseModels3DMath.project3DTo2D(
                    near.x, near.y, near.z, camera, projection
                );
                const projFar = window.GreenhouseModels3DMath.project3DTo2D(
                    far.x, far.y, far.z, camera, projection
                );
                
                const centerX = projection.width / 2;
                const centerY = projection.height / 2;
                
                const distNear = Math.sqrt(
                    Math.pow(projNear.x - centerX, 2) + 
                    Math.pow(projNear.y - centerY, 2)
                );
                const distFar = Math.sqrt(
                    Math.pow(projFar.x - centerX, 2) + 
                    Math.pow(projFar.y - centerY, 2)
                );
                
                expect(distNear).toBeGreaterThan(distFar);
            }
        });
    });

    describe('Camera Position', () => {
        it('should affect projection based on camera position', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: -200 };
                
                camera.x = 0;
                const proj1 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                camera.x = 100;
                const proj2 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(proj1.x).not.toBe(proj2.x);
            }
        });

        it('should handle camera Y position', () => {
            if (window.GreenhouseModels3DMath) {
                const point3D = { x: 0, y: 0, z: -200 };
                
                camera.y = 0;
                const proj1 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                camera.y = 100;
                const proj2 = window.GreenhouseModels3DMath.project3DTo2D(
                    point3D.x, point3D.y, point3D.z, camera, projection
                );
                
                expect(proj1.y).not.toBe(proj2.y);
            }
        });
    });

    describe('Multiple Points', () => {
        it('should project array of points', () => {
            if (window.GreenhouseModels3DMath) {
                const points = [
                    { x: -100, y: 0, z: -200 },
                    { x: 0, y: 0, z: -200 },
                    { x: 100, y: 0, z: -200 }
                ];
                
                const projected = points.map(p => 
                    window.GreenhouseModels3DMath.project3DTo2D(
                        p.x, p.y, p.z, camera, projection
                    )
                );
                
                expect(projected.length).toBe(3);
                expect(projected[0].x).toBeLessThan(projected[1].x);
                expect(projected[1].x).toBeLessThan(projected[2].x);
            }
        });
    });

    describe('Rotation Matrix', () => {
        it('should apply rotation around Y axis', () => {
            if (window.GreenhouseModels3DMath && window.GreenhouseModels3DMath.rotateY) {
                const point = { x: 100, y: 0, z: 0 };
                const angle = Math.PI / 2;
                
                const rotated = window.GreenhouseModels3DMath.rotateY(point, angle);
                
                expect(Math.abs(rotated.x)).toBeLessThan(1);
                expect(Math.abs(rotated.z - 100)).toBeLessThan(1);
            }
        });

        it('should apply rotation around X axis', () => {
            if (window.GreenhouseModels3DMath && window.GreenhouseModels3DMath.rotateX) {
                const point = { x: 0, y: 100, z: 0 };
                const angle = Math.PI / 2;
                
                const rotated = window.GreenhouseModels3DMath.rotateX(point, angle);
                
                expect(Math.abs(rotated.y)).toBeLessThan(1);
                expect(Math.abs(rotated.z - 100)).toBeLessThan(1);
            }
        });

        it('should apply rotation around Z axis', () => {
            if (window.GreenhouseModels3DMath && window.GreenhouseModels3DMath.rotateZ) {
                const point = { x: 100, y: 0, z: 0 };
                const angle = Math.PI / 2;
                
                const rotated = window.GreenhouseModels3DMath.rotateZ(point, angle);
                
                expect(Math.abs(rotated.x)).toBeLessThan(1);
                expect(Math.abs(rotated.y - 100)).toBeLessThan(1);
            }
        });
    });

    describe('Vector Math', () => {
        it('should calculate distance between points', () => {
            if (window.GreenhouseModels3DMath && window.GreenhouseModels3DMath.distance) {
                const p1 = { x: 0, y: 0, z: 0 };
                const p2 = { x: 3, y: 4, z: 0 };
                
                const dist = window.GreenhouseModels3DMath.distance(p1, p2);
                
                expect(dist).toBe(5);
            }
        });

        it('should normalize vectors', () => {
            if (window.GreenhouseModels3DMath && window.GreenhouseModels3DMath.normalize) {
                const vec = { x: 3, y: 4, z: 0 };
                const normalized = window.GreenhouseModels3DMath.normalize(vec);
                
                const length = Math.sqrt(
                    normalized.x * normalized.x +
                    normalized.y * normalized.y +
                    normalized.z * normalized.z
                );
                
                expect(Math.abs(length - 1.0)).toBeLessThan(0.001);
            }
        });

        it('should calculate dot product', () => {
            if (window.GreenhouseModels3DMath && window.GreenhouseModels3DMath.dot) {
                const v1 = { x: 1, y: 0, z: 0 };
                const v2 = { x: 0, y: 1, z: 0 };
                
                const dot = window.GreenhouseModels3DMath.dot(v1, v2);
                
                expect(dot).toBe(0);
            }
        });

        it('should calculate cross product', () => {
            if (window.GreenhouseModels3DMath && window.GreenhouseModels3DMath.cross) {
                const v1 = { x: 1, y: 0, z: 0 };
                const v2 = { x: 0, y: 1, z: 0 };
                
                const cross = window.GreenhouseModels3DMath.cross(v1, v2);
                
                expect(cross.x).toBe(0);
                expect(cross.y).toBe(0);
                expect(cross.z).toBe(1);
            }
        });
    });

    describe('Performance', () => {
        it('should project many points efficiently', () => {
            if (window.GreenhouseModels3DMath) {
                const points = [];
                for (let i = 0; i < 1000; i++) {
                    points.push({
                        x: Math.random() * 200 - 100,
                        y: Math.random() * 200 - 100,
                        z: -Math.random() * 500 - 100
                    });
                }
                
                const start = performance.now();
                
                points.forEach(p => {
                    window.GreenhouseModels3DMath.project3DTo2D(
                        p.x, p.y, p.z, camera, projection
                    );
                });
                
                const end = performance.now();
                const duration = end - start;
                
                expect(duration).toBeLessThan(100);
            }
        });
    });
});

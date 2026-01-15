(function () {
    'use strict';

    const GreenhouseGeneticChromosome = {
        drawChromatinStructure(ctx, x, y, w, h, activeGene, drawPiPFrameCallback, cameraState) {
            if (drawPiPFrameCallback) {
                drawPiPFrameCallback(ctx, x, y, w, h, "Chromatin Structure");
            }

            if (!activeGene) return;

            const time = Date.now() * 0.001;
            const rotationY = time * 0.2;

            // Use the specific camera for this PiP if provided
            let camera;
            if (cameraState && cameraState.camera) {
                camera = cameraState.camera;
            } else {
                // Adjusted camera for vertical chromosome
                camera = {
                    x: 0, y: 0, z: -250, // Closer for better view
                    rotationX: 0, // No X rotation for vertical view
                    rotationY: rotationY,
                    rotationZ: 0,
                    fov: 500
                };
            }

            const config = window.GreenhouseGeneticConfig;
            const lighting = window.GreenhouseGeneticLighting;

            // Generate or Retrieve Chromosome Mesh
            if (!this.chromosomeMesh && window.GreenhouseGeneticGeometry) {
                this.chromosomeMesh = window.GreenhouseGeneticGeometry.generateChromosomeMesh();
            }

            if (this.chromosomeMesh) {
                // Render Mesh with enhanced lighting
                const { vertices, faces } = this.chromosomeMesh;

                // Project Vertices
                const projected = vertices.map(v => {
                    // Rotate
                    let vx = v.x, vy = v.y, vz = v.z;
                    // Rot Y
                    let tx = vx * Math.cos(camera.rotationY) - vz * Math.sin(camera.rotationY);
                    let tz = vx * Math.sin(camera.rotationY) + vz * Math.cos(camera.rotationY);
                    vx = tx; vz = tz;
                    // Rot X
                    let ty = vy * Math.cos(camera.rotationX) - vz * Math.sin(camera.rotationX);
                    tz = vy * Math.sin(camera.rotationX) + vz * Math.cos(camera.rotationX);
                    vy = ty; vz = tz;

                    const p = GreenhouseModels3DMath.project3DTo2D(vx, vy, vz, camera, { width: w, height: h, near: 10, far: 5000 });
                    return { x: p.x + x, y: p.y + y, z: p.depth, scale: p.scale, vx, vy, vz };
                });

                // Sort Faces by Depth (Painter's Algorithm)
                const sortedFaces = faces.map(face => {
                    const p1 = projected[face[0]];
                    const p2 = projected[face[1]];
                    const p3 = projected[face[2]];
                    const z = (p1.z + p2.z + p3.z) / 3;

                    // Calculate face normal for lighting
                    const v1 = projected[face[0]];
                    const v2 = projected[face[1]];
                    const v3 = projected[face[2]];

                    // Edge vectors
                    const e1x = v2.vx - v1.vx;
                    const e1y = v2.vy - v1.vy;
                    const e1z = v2.vz - v1.vz;
                    const e2x = v3.vx - v1.vx;
                    const e2y = v3.vy - v1.vy;
                    const e2z = v3.vz - v1.vz;

                    // Cross product for normal
                    const nx = e1y * e2z - e1z * e2y;
                    const ny = e1z * e2x - e1x * e2z;
                    const nz = e1x * e2y - e1y * e2x;
                    const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);

                    return {
                        face, z, p1, p2, p3,
                        normal: { x: nx / nlen, y: ny / nlen, z: nz / nlen },
                        center: { x: (v1.vx + v2.vx + v3.vx) / 3, y: (v1.vy + v2.vy + v3.vy) / 3, z: (v1.vz + v2.vz + v3.vz) / 3 }
                    };
                }).sort((a, b) => b.z - a.z);

                // Draw Faces with enhanced lighting
                sortedFaces.forEach(f => {
                    if (f.p1.scale > 0 && f.p2.scale > 0 && f.p3.scale > 0) {
                        // Base chromosome color (purple/blue)
                        const baseColor = { r: 150, g: 100, b: 200 };

                        let finalColor;
                        if (lighting && config) {
                            // Apply realistic lighting
                            const material = {
                                baseColor: baseColor,
                                metallic: 0.3,
                                roughness: 0.5,
                                emissive: false,
                                alpha: 0.9
                            };

                            const lit = lighting.calculateLighting(f.normal, f.center, camera, material);
                            finalColor = lighting.toRGBA(lit);
                        } else {
                            // Fallback: simple depth-based shading
                            const depthAlpha = Math.min(1, Math.max(0.2, 1 - f.z / 1000));
                            const shade = Math.floor(100 + depthAlpha * 100);
                            finalColor = `rgba(${shade}, ${shade}, ${shade + 50}, ${depthAlpha})`;
                        }

                        // Draw face
                        ctx.fillStyle = finalColor;
                        ctx.beginPath();
                        ctx.moveTo(f.p1.x, f.p1.y);
                        ctx.lineTo(f.p2.x, f.p2.y);
                        ctx.lineTo(f.p3.x, f.p3.y);
                        ctx.closePath();
                        ctx.fill();

                        // Add subtle edge highlight for definition
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });

                // Add texture overlay for chromatin appearance
                ctx.save();
                ctx.globalAlpha = 0.1;
                ctx.fillStyle = ctx.createPattern(this.getTextureCanvas(), 'repeat');
                ctx.fillRect(x, y, w, h);
                ctx.restore();
            }
        },

        /**
         * Generate texture canvas for chromatin appearance
         * @returns {HTMLCanvasElement} Texture canvas
         */
        getTextureCanvas() {
            if (!this.textureCanvas) {
                this.textureCanvas = document.createElement('canvas');
                this.textureCanvas.width = 64;
                this.textureCanvas.height = 64;
                const ctx = this.textureCanvas.getContext('2d');

                // Create fibrous texture
                for (let i = 0; i < 100; i++) {
                    const x = Math.random() * 64;
                    const y = Math.random() * 64;
                    const len = Math.random() * 10 + 5;
                    const angle = Math.random() * Math.PI * 2;

                    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
                    ctx.stroke();
                }
            }
            return this.textureCanvas;
        }
    };

    window.GreenhouseGeneticChromosome = GreenhouseGeneticChromosome;
})();

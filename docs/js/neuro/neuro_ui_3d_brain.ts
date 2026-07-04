/**
 * @file neuro_ui_3d_brain.ts
 * @description Enhanced 3D Brain Rendering Engine with Post-processing and advanced Shading for Neuro simulation.
 */

/// <reference path="../types/globals.d.ts" />

export interface BrainVertex extends Greenhouse.Point3D {
    region?: string;
    curvature?: number;
}

export interface BrainFace {
    indices: number[];
    region?: string;
}

export interface BrainShell {
    vertices: BrainVertex[];
    faces: BrainFace[];
    latBands?: number;
    lonBands?: number;
}

export const GreenhouseNeuroBrain = {
    _vertexPool: [] as any[],
    _facePool: [] as any[],
    _precomputedBoundaries: null as any,
    _frameBuffer: null as any,
    _prevFrameBuffer: null as any,

    drawBrainShell(ctx: CanvasRenderingContext2D, brainShell: BrainShell, camera: Greenhouse.Camera, projection: Greenhouse.Projection, width: number, height: number, activeGene: any = null): void {
        const targetRegion = activeGene ? activeGene.region : null;
        if (!brainShell) return;

        // Project all vertices
        const projectedVertices: (any | null)[] = [];
        if (brainShell.vertices) {
            for (let i = 0; i < brainShell.vertices.length; i++) {
                const v = brainShell.vertices[i];
                if (!v) {
                    projectedVertices.push(null);
                    continue;
                }
                const p = (window as any).GreenhouseModels3DMath.project3DTo2D(v.x, v.y, v.z, camera, projection);
                projectedVertices.push(p);
            }
        }

        const facesToDraw: any[] = [];
        for (let i = 0; i < brainShell.faces.length; i++) {
            const face = brainShell.faces[i];
            const indices = face.indices;
            const p1 = projectedVertices[indices[0]];
            const p2 = projectedVertices[indices[1]];
            const p3 = projectedVertices[indices[2]];

            if (p1 && p2 && p3 && p1.scale > 0 && p2.scale > 0 && p3.scale > 0) {
                // Backface Culling
                const cross = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
                if (cross < 0) {
                    const v1 = brainShell.vertices[indices[0]];
                    const v2 = brainShell.vertices[indices[1]];
                    const v3 = brainShell.vertices[indices[2]];
                    if (!v1 || !v2 || !v3) continue;
                    const normal = (window as any).GreenhouseModels3DMath.calculateFaceNormal(v1, v2, v3);
                    const depth = (p1.depth + p2.depth + p3.depth) / 3;
                    facesToDraw.push({ indices, p1, p2, p3, depth, normal, region: face.region || v1.region });
                }
            }
        }

        // Sort by depth (Back to Front)
        facesToDraw.sort((a, b) => b.depth - a.depth);

        // Draw Faces
        facesToDraw.forEach(f => {
            const material = {
                baseColor: { r: 180, g: 190, b: 200 },
                roughness: 0.4,
                metalness: 0.05,
                sss: true,
                alpha: 0.25
            };

            const v0 = brainShell.vertices[f.indices[0]];
            const v1 = brainShell.vertices[f.indices[1]];
            const v2 = brainShell.vertices[f.indices[2]];
            if (!v0 || !v1 || !v2) return;

            const center = {
                x: (v0.x + v1.x + v2.x) / 3,
                y: (v0.y + v1.y + v2.y) / 3,
                z: (v0.z + v1.z + v2.z) / 3
            };

            // Ambient Occlusion: Proxy sulcal depth using curvature
            // v.curvature is 0..1, higher values = more "fold"
            const ao = Math.max(0.1, 1.0 - (v0.curvature || 0) * 2.5);

            const color = (window as any).GreenhouseNeuroLighting.calculateLighting(f.normal, center, camera, material);

            // Apply AO for anatomical depth
            color.r *= ao; color.g *= ao; color.b *= ao;

            const isTarget = targetRegion && (f.region === targetRegion);
            const alphaToUse = isTarget ? 0.85 : material.alpha;
            const fog = (window as any).GreenhouseModels3DMath.applyDepthFog(alphaToUse, f.depth);

            ctx.fillStyle = `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${fog})`;
            ctx.beginPath();
            ctx.moveTo(f.p1.x, f.p1.y);
            ctx.lineTo(f.p2.x, f.p2.y);
            ctx.lineTo(f.p3.x, f.p3.y);
            ctx.fill();

            // Item 20: Clean outline pass for educational segmentation
            if (isTarget) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${fog})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }
        });

        // HUD Overlays
        this.drawSurfaceGrid(ctx, projectedVertices, brainShell);
        this.drawOrientationWidget(ctx, camera, width, height);
    },

    drawSurfaceGrid(ctx: CanvasRenderingContext2D, projectedVertices: any[], brainShell: BrainShell): void {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 0.3;
        ctx.beginPath();

        const latBands = brainShell.latBands || 40;
        const lonBands = brainShell.lonBands || 40;
        const step = Math.floor(latBands / 10) || 4;

        for (let lat = 0; lat <= latBands; lat += step) {
            for (let lon = 0; lon <= lonBands; lon++) {
                const i = lat * (lonBands + 1) + lon;
                const p = projectedVertices[i];
                if (p && p.scale > 0) {
                    if (lon === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                }
            }
        }
        ctx.stroke();
        ctx.restore();
    },

    // Item 36: Mini-map orientation widget
    drawOrientationWidget(ctx: CanvasRenderingContext2D, camera: Greenhouse.Camera, width: number, height: number): void {
        const size = 60;
        const ox = width - size - 20;
        const oy = size + 20;

        ctx.save();
        ctx.translate(ox, oy);

        const axes = [
            { x: 1, y: 0, z: 0, label: 'L', color: '#ff4444' },
            { x: 0, y: 1, z: 0, label: 'S', color: '#44ff44' },
            { x: 0, y: 0, z: 1, label: 'P', color: '#4444ff' }
        ];

        axes.forEach(axis => {
            const p = (window as any).GreenhouseModels3DMath.project3DTo2D(axis.x * 30, axis.y * 30, axis.z * 30,
                { x: 0, y: 0, z: -100, rotationX: camera.rotationX, rotationY: camera.rotationY, rotationZ: camera.rotationZ, fov: 200 },
                { width: 0, height: 0, near: 1, far: 1000 });

            ctx.beginPath();
            ctx.strokeStyle = axis.color;
            ctx.moveTo(0, 0);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();

            ctx.fillStyle = axis.color;
            ctx.font = '10px Arial';
            ctx.fillText(axis.label, p.x, p.y);
        });
        ctx.restore();
    }
};

(window as any).GreenhouseNeuroBrain = GreenhouseNeuroBrain;

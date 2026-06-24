/**
 * @file models_3d_math.ts
 * @description 3D Mathematics Foundation for Models Canvas.
 */

/// <reference path="types/globals.d.ts" />

const GreenhouseModels3DMath = {
    /**
     * Projects a 3D point to 2D screen coordinates using perspective projection
     */
    project3DTo2D(x: number, y: number, z: number, camera: Greenhouse.Camera, projection: Greenhouse.Projection): { x: number, y: number, depth: number, scale: number } {
        const dx = x - camera.x;
        const dy = y - camera.y;
        const dz = z - camera.z;

        let rotatedX = dx;
        let rotatedY = dy;
        let rotatedZ = dz;

        if (camera.rotationX || camera.rotationY || camera.rotationZ) {
            const rotated = this.rotatePoint3D(
                { x: dx, y: dy, z: dz },
                -(camera.rotationX || 0),
                -(camera.rotationY || 0),
                -(camera.rotationZ || 0)
            );
            rotatedX = rotated.x;
            rotatedY = rotated.y;
            rotatedZ = rotated.z;
        }

        const fov = camera.fov || 500;
        const scale = fov / (fov + rotatedZ);

        const screenX = (rotatedX * scale) + (projection.width / 2);
        const screenY = (projection.height / 2) - (rotatedY * scale);

        const depth = (rotatedZ - projection.near) / (projection.far - projection.near);

        return {
            x: screenX,
            y: screenY,
            depth: Math.max(0, Math.min(1, depth)),
            scale: scale
        };
    },

    /**
     * Rotates a 3D point around the origin
     */
    rotatePoint3D(point: Greenhouse.Point3D, angleX: number, angleY: number, angleZ: number): Greenhouse.Point3D {
        let { x, y, z } = point;

        if (angleX !== 0) {
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);
            const newY = y * cosX - z * sinX;
            const newZ = y * sinX + z * cosX;
            y = newY;
            z = newZ;
        }

        if (angleY !== 0) {
            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            const newX = x * cosY + z * sinY;
            const newZ = -x * sinY + z * cosY;
            x = newX;
            z = newZ;
        }

        if (angleZ !== 0) {
            const cosZ = Math.cos(angleZ);
            const sinZ = Math.sin(angleZ);
            const newX = x * cosZ - y * sinZ;
            const newY = x * sinZ + y * cosZ;
            x = newX;
            y = newY;
        }

        return { x, y, z };
    },

    /**
     * Creates a 3D transformation matrix (simplified)
     */
    transformMatrix3D(translation: Greenhouse.Point3D, rotation: Greenhouse.Point3D, scale: Greenhouse.Point3D): any {
        return {
            translation: translation || { x: 0, y: 0, z: 0 },
            rotation: rotation || { x: 0, y: 0, z: 0 },
            scale: scale || { x: 1, y: 1, z: 1 }
        };
    },

    /**
     * Calculates the depth/distance from camera to a 3D point
     */
    calculateDepth(point3D: Greenhouse.Point3D, camera: Greenhouse.Point3D): number {
        const dx = point3D.x - camera.x;
        const dy = point3D.y - camera.y;
        const dz = point3D.z - camera.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    /**
     * Sorts an array of 3D objects by depth (painter's algorithm)
     */
    sortByDepth(objects: any[], camera: Greenhouse.Point3D): any[] {
        return objects.slice().sort((a, b) => {
            const depthA = this.calculateDepth(a.position || a, camera);
            const depthB = this.calculateDepth(b.position || b, camera);
            return depthB - depthA;
        });
    },

    /**
     * Creates an isometric projection
     */
    projectIsometric(x: number, y: number, z: number, settings: any): Greenhouse.Point2D {
        const scale = settings.scale || 1;
        const screenX = (x - z) * Math.cos(Math.PI / 6) * scale + settings.offsetX;
        const screenY = (x + z) * Math.sin(Math.PI / 6) * scale - y * scale + settings.offsetY;
        return { x: screenX, y: screenY };
    },

    /**
     * Interpolates between two 3D points
     */
    lerp3D(start: Greenhouse.Point3D, end: Greenhouse.Point3D, t: number): Greenhouse.Point3D {
        return {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            z: start.z + (end.z - start.z) * t
        };
    },

    /**
     * Calculates normal vector for a triangle
     */
    calculateNormal(p1: Greenhouse.Point3D, p2: Greenhouse.Point3D, p3: Greenhouse.Point3D): Greenhouse.Point3D {
        const v1 = {
            x: p2.x - p1.x,
            y: p2.y - p1.y,
            z: p2.z - p1.z
        };
        const v2 = {
            x: p3.x - p1.x,
            y: p3.y - p1.y,
            z: p3.z - p1.z
        };

        const normal = {
            x: v1.y * v2.z - v1.z * v2.y,
            y: v1.z * v2.x - v1.x * v2.z,
            z: v1.x * v2.y - v1.y * v2.x
        };

        const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
        if (length > 0) {
            normal.x /= length;
            normal.y /= length;
            normal.z /= length;
        }

        return normal;
    },

    /**
     * Applies depth-based alpha blending
     */
    applyDepthFog(baseAlpha: number, depth: number, fogStart = 0.7, fogEnd = 1.0): number {
        if (isNaN(depth)) return 0;
        if (depth < fogStart) return baseAlpha;
        if (depth > fogEnd) return 0;
        const fogFactor = (depth - fogStart) / (fogEnd - fogStart);
        return baseAlpha * (1 - fogFactor);
    },

    /**
     * Checks if a point is within the view frustum
     */
    isInFrustum(point: Greenhouse.Point3D, camera: Greenhouse.Camera, projection: Greenhouse.Projection): boolean {
        const dz = point.z - camera.z;
        return dz > projection.near && dz < projection.far;
    },

    /**
     * Converts degrees to radians
     */
    degToRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    },

    /**
     * Converts radians to degrees
     */
    radToDeg(radians: number): number {
        return radians * (180 / Math.PI);
    },

    calculateFaceNormal(p1: Greenhouse.Point3D, p2: Greenhouse.Point3D, p3: Greenhouse.Point3D): Greenhouse.Point3D {
        return this.calculateNormal(p1, p2, p3);
    },

    /**
     * Calculates simple diffuse lighting.
     */
    calculateDiffuse(normal: Greenhouse.Point3D, lightDirection: Greenhouse.Point3D, ambientLight = 0.1): number {
        const dotProduct = normal.x * lightDirection.x + normal.y * lightDirection.y + normal.z * lightDirection.z;
        const diffuse = Math.max(0, -dotProduct);
        return ambientLight + (1 - ambientLight) * diffuse;
    }
};

(window as any).GreenhouseModels3DMath = GreenhouseModels3DMath;

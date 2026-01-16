// docs/js/models_3d_math.js
// 3D Mathematics Foundation for Models Canvas
// Implements perspective projection, transformations, and depth calculations

(function () {
    'use strict';

    const GreenhouseModels3DMath = {
        /**
         * Projects a 3D point to 2D screen coordinates using perspective projection
         * @param {number} x - X coordinate in 3D space
         * @param {number} y - Y coordinate in 3D space
         * @param {number} z - Z coordinate in 3D space (depth)
         * @param {Object} camera - Camera configuration {x, y, z, fov}
         * @param {Object} projection - Projection settings {width, height, near, far}
         * @returns {Object} {x, y, depth} - 2D screen coordinates and depth value
         */
        project3DTo2D(x, y, z, camera, projection) {
            // Translate to camera space
            const dx = x - camera.x;
            const dy = y - camera.y;
            const dz = z - camera.z;

            // Apply camera rotation if present
            // IMPORTANT: We need to rotate the point in the OPPOSITE direction of camera rotation
            // because we're rotating the world around the camera, not the camera itself
            let rotatedX = dx;
            let rotatedY = dy;
            let rotatedZ = dz;

            if (camera.rotationX || camera.rotationY || camera.rotationZ) {
                const rotated = this.rotatePoint3D(
                    { x: dx, y: dy, z: dz },
                    -(camera.rotationX || 0),  // Negate rotation
                    -(camera.rotationY || 0),  // Negate rotation
                    -(camera.rotationZ || 0)   // Negate rotation
                );
                rotatedX = rotated.x;
                rotatedY = rotated.y;
                rotatedZ = rotated.z;
            }

            // Perspective division
            const fov = camera.fov || 500;
            const scale = fov / (fov + rotatedZ);

            // Project to screen space (Flipping Y so positive 3D Y is screen up)
            const screenX = (rotatedX * scale) + (projection.width / 2);
            const screenY = (projection.height / 2) - (rotatedY * scale);

            // Calculate normalized depth (0 = near, 1 = far)
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
         * @param {Object} point - {x, y, z} coordinates
         * @param {number} angleX - Rotation around X axis (radians)
         * @param {number} angleY - Rotation around Y axis (radians)
         * @param {number} angleZ - Rotation around Z axis (radians)
         * @returns {Object} Rotated point {x, y, z}
         */
        rotatePoint3D(point, angleX, angleY, angleZ) {
            let { x, y, z } = point;

            // Rotate around X axis
            if (angleX !== 0) {
                const cosX = Math.cos(angleX);
                const sinX = Math.sin(angleX);
                const newY = y * cosX - z * sinX;
                const newZ = y * sinX + z * cosX;
                y = newY;
                z = newZ;
            }

            // Rotate around Y axis
            if (angleY !== 0) {
                const cosY = Math.cos(angleY);
                const sinY = Math.sin(angleY);
                const newX = x * cosY + z * sinY;
                const newZ = -x * sinY + z * cosY;
                x = newX;
                z = newZ;
            }

            // Rotate around Z axis
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
         * Creates a 3D transformation matrix
         * @param {Object} translation - {x, y, z} translation
         * @param {Object} rotation - {x, y, z} rotation in radians
         * @param {Object} scale - {x, y, z} scale factors
         * @returns {Array} 4x4 transformation matrix
         */
        transformMatrix3D(translation, rotation, scale) {
            // Simplified matrix for basic transformations
            // In a full implementation, this would return a proper 4x4 matrix
            return {
                translation: translation || { x: 0, y: 0, z: 0 },
                rotation: rotation || { x: 0, y: 0, z: 0 },
                scale: scale || { x: 1, y: 1, z: 1 }
            };
        },

        /**
         * Calculates the depth/distance from camera to a 3D point
         * @param {Object} point3D - {x, y, z} coordinates
         * @param {Object} camera - Camera position {x, y, z}
         * @returns {number} Distance from camera
         */
        calculateDepth(point3D, camera) {
            const dx = point3D.x - camera.x;
            const dy = point3D.y - camera.y;
            const dz = point3D.z - camera.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        },

        /**
         * Sorts an array of 3D objects by depth (painter's algorithm)
         * @param {Array} objects - Array of objects with 3D coordinates
         * @param {Object} camera - Camera position
         * @returns {Array} Sorted array (back to front)
         */
        sortByDepth(objects, camera) {
            return objects.slice().sort((a, b) => {
                const depthA = this.calculateDepth(a.position || a, camera);
                const depthB = this.calculateDepth(b.position || b, camera);
                return depthB - depthA; // Back to front
            });
        },

        /**
         * Creates an isometric projection (alternative to perspective)
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} z - Z coordinate
         * @param {Object} settings - {scale, offsetX, offsetY}
         * @returns {Object} {x, y} screen coordinates
         */
        projectIsometric(x, y, z, settings) {
            const scale = settings.scale || 1;
            const screenX = (x - z) * Math.cos(Math.PI / 6) * scale + settings.offsetX;
            const screenY = (x + z) * Math.sin(Math.PI / 6) * scale - y * scale + settings.offsetY;
            return { x: screenX, y: screenY };
        },

        /**
         * Interpolates between two 3D points
         * @param {Object} start - Starting point {x, y, z}
         * @param {Object} end - Ending point {x, y, z}
         * @param {number} t - Interpolation factor (0-1)
         * @returns {Object} Interpolated point {x, y, z}
         */
        lerp3D(start, end, t) {
            return {
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t,
                z: start.z + (end.z - start.z) * t
            };
        },

        /**
         * Calculates normal vector for a triangle (for lighting)
         * @param {Object} p1 - First point {x, y, z}
         * @param {Object} p2 - Second point {x, y, z}
         * @param {Object} p3 - Third point {x, y, z}
         * @returns {Object} Normal vector {x, y, z}
         */
        calculateNormal(p1, p2, p3) {
            // Calculate two edge vectors
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

            // Cross product
            const normal = {
                x: v1.y * v2.z - v1.z * v2.y,
                y: v1.z * v2.x - v1.x * v2.z,
                z: v1.x * v2.y - v1.y * v2.x
            };

            // Normalize
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
         * @param {number} baseAlpha - Base alpha value (0-1)
         * @param {number} depth - Normalized depth (0-1)
         * @param {number} fogStart - Depth where fog starts (0-1)
         * @param {number} fogEnd - Depth where fog is complete (0-1)
         * @returns {number} Modified alpha value
         */
        applyDepthFog(baseAlpha, depth, fogStart = 0.7, fogEnd = 1.0) {
            if (depth < fogStart) return baseAlpha;
            if (depth > fogEnd) return 0;
            const fogFactor = (depth - fogStart) / (fogEnd - fogStart);
            return baseAlpha * (1 - fogFactor);
        },

        /**
         * Checks if a point is within the view frustum
         * @param {Object} point - 3D point {x, y, z}
         * @param {Object} camera - Camera configuration
         * @param {Object} projection - Projection settings
         * @returns {boolean} True if point is visible
         */
        isInFrustum(point, camera, projection) {
            const dz = point.z - camera.z;
            return dz > projection.near && dz < projection.far;
        },

        /**
         * Converts degrees to radians
         * @param {number} degrees
         * @returns {number} Radians
         */
        degToRad(degrees) {
            return degrees * (Math.PI / 180);
        },

        /**
         * Converts radians to degrees
         * @param {number} radians
         * @returns {number} Degrees
         */
        radToDeg(radians) {
            return radians * (180 / Math.PI);
        },

        /**
         * Calculates normal vector for a triangle (alias for calculateNormal for compatibility).
         * @param {Object} p1 - First point {x, y, z}
         * @param {Object} p2 - Second point {x, y, z}
         * @param {Object} p3 - Third point {x, y, z}
         * @returns {Object} Normal vector {x, y, z}
         */
        calculateFaceNormal(p1, p2, p3) {
            // This is an alias for the existing calculateNormal function.
            return this.calculateNormal(p1, p2, p3);
        },

        /**
         * Calculates simple diffuse lighting.
         * @param {Object} normal - The surface normal vector {x, y, z}.
         * @param {Object} lightDirection - The direction of the light source, normalized.
         * @param {number} ambientLight - The minimum ambient light level (e.g., 0.1).
         * @returns {number} The brightness value from ambientLight to 1.0.
         */
        calculateDiffuse(normal, lightDirection, ambientLight = 0.1) {
            const dotProduct = normal.x * lightDirection.x + normal.y * lightDirection.y + normal.z * lightDirection.z;
            // The light comes FROM the direction, so we need to negate the dot product
            // if the light direction is pointing TO the source. Assuming it points FROM the source.
            // Let's assume lightDirection is vector from surface to light.
            // No, standard is light points from light source.
            const diffuse = Math.max(0, -dotProduct);
            return ambientLight + (1 - ambientLight) * diffuse;
        }
    };

    // Export to global scope
    window.GreenhouseModels3DMath = GreenhouseModels3DMath;
})();

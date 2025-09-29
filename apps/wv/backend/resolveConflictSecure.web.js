// Version: 1.0.0
import { webMethod, Permissions } from 'wix-web-module';
import wixUsersBackend from 'wix-users-backend';
import wixData from 'wix-data';

console.log("Loading resolveConflictSecure.web.js - Version 1.0.0");

/**
 * Admin-only function to resolve scheduling conflicts
 * @param {string} conflictId - The ID of the conflict to resolve
 * @param {Object} resolutionDetails - Details about the resolution
 */
export const resolveConflict = webMethod(Permissions.SiteMember, async (conflictId, resolutionDetails) => {
    try {
        // 1. Validate admin permissions
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

        if (!isAdmin) {
            throw new Error("Permission Denied: You cannot perform this action.");
        }

        // 2. Validate input parameters
        if (!conflictId || !resolutionDetails) {
            throw new Error("Invalid parameters: conflictId and resolutionDetails are required.");
        }

        console.log(`Backend: Admin resolving conflict ${conflictId}`);

        // 3. Update the conflict in the database
        const updatedConflict = await wixData.update("Conflicts", {
            _id: conflictId,
            status: "resolved",
            resolution: resolutionDetails.resolution || "Resolved by administrator",
            resolvedBy: wixUsersBackend.currentUser.id,
            resolvedAt: new Date(),
            notes: resolutionDetails.notes || "",
            ...resolutionDetails
        });

        // 4. Log the resolution for audit purposes
        await wixData.insert("ConflictResolutionLog", {
            conflictId: conflictId,
            resolvedBy: wixUsersBackend.currentUser.id,
            resolvedAt: new Date(),
            resolutionDetails: resolutionDetails,
            adminAction: true
        });

        return {
            success: true,
            message: "Conflict resolved successfully.",
            conflictId: conflictId,
            resolvedAt: new Date()
        };

    } catch (error) {
        console.error("Error resolving conflict:", error);
        throw new Error(error.message || "Failed to resolve conflict.");
    }
});

/**
 * Admin-only function to get all conflicts
 */
export const getConflicts = webMethod(Permissions.SiteMember, async () => {
    try {
        // 1. Validate admin permissions
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

        if (!isAdmin) {
            throw new Error("Permission Denied: You do not have access to this data.");
        }

        console.log("Backend: Admin fetching all conflicts.");

        // 2. Fetch all conflicts
        const results = await wixData.query("Conflicts")
            .descending("_createdDate")
            .find();

        return {
            items: results.items,
            totalCount: results.totalCount,
            userRole: 'admin'
        };

    } catch (error) {
        console.error("Error fetching conflicts:", error);
        throw new Error(error.message || "Failed to retrieve conflicts.");
    }
});

/**
 * Admin-only function to get conflict resolution history
 */
export const getConflictResolutionHistory = webMethod(Permissions.SiteMember, async (conflictId = null) => {
    try {
        // 1. Validate admin permissions
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

        if (!isAdmin) {
            throw new Error("Permission Denied: You do not have access to this data.");
        }

        console.log("Backend: Admin fetching conflict resolution history.");

        // 2. Build query
        let query = wixData.query("ConflictResolutionLog")
            .descending("resolvedAt");

        if (conflictId) {
            query = query.eq("conflictId", conflictId);
        }

        const results = await query.find();

        return {
            items: results.items,
            totalCount: results.totalCount,
            userRole: 'admin'
        };

    } catch (error) {
        console.error("Error fetching resolution history:", error);
        throw new Error(error.message || "Failed to retrieve resolution history.");
    }
});

/**
 * Admin-only function to create a new conflict entry
 */
export const createConflict = webMethod(Permissions.SiteMember, async (conflictData) => {
    try {
        // 1. Validate admin permissions
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

        if (!isAdmin) {
            throw new Error("Permission Denied: You cannot perform this action.");
        }

        // 2. Validate input
        if (!conflictData || !conflictData.description) {
            throw new Error("Invalid parameters: conflict description is required.");
        }

        console.log("Backend: Admin creating new conflict entry.");

        // 3. Create conflict entry
        const newConflict = await wixData.insert("Conflicts", {
            ...conflictData,
            status: "pending",
            createdBy: wixUsersBackend.currentUser.id,
            createdAt: new Date()
        });

        return {
            success: true,
            conflict: newConflict,
            message: "Conflict created successfully."
        };

    } catch (error) {
        console.error("Error creating conflict:", error);
        throw new Error(error.message || "Failed to create conflict.");
    }
});

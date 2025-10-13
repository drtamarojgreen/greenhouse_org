// Version: 1.0.0
import { webMethod, Permissions } from 'wix-web-module';
import wixUsersBackend from 'wix-users-backend';

console.log("Loading permissions.web.js - Version 1.0.0");

/**
 * Utility functions for handling user permissions and role validation
 */

/**
 * Check if the current user has admin privileges
 * @returns {Promise<boolean>} True if user is admin or developer
 */
export const isCurrentUserAdmin = webMethod(Permissions.Anyone, async () => {
    try {
        const currentUser = wixUsersBackend.currentUser;

        // Check if user is logged in
        if (!currentUser.loggedIn) {
            return false;
        }

        const roles = await currentUser.getRoles();
        return roles.some(r => r.name === "Administrator" || r.name === "Developer");
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
});

/**
 * Check if the current user is logged in
 * @returns {Promise<boolean>} True if user is logged in
 */
export const isCurrentUserLoggedIn = webMethod(Permissions.Anyone, async () => {
    try {
        const currentUser = wixUsersBackend.currentUser;
        return currentUser.loggedIn;
    } catch (error) {
        console.error("Error checking login status:", error);
        return false;
    }
});

/**
 * Get current user's roles
 * @returns {Promise<Array>} Array of user roles
 */
export const getCurrentUserRoles = webMethod(Permissions.SiteMember, async () => {
    try {
        const roles = await wixUsersBackend.currentUser.getRoles();
        return roles.map(r => r.name);
    } catch (error) {
        console.error("Error getting user roles:", error);
        return [];
    }
});

/**
 * Validate admin permissions - throws error if user is not admin
 * @throws {Error} If user is not admin
 */
export const validateAdminPermissions = webMethod(Permissions.SiteMember, async () => {
    const roles = await wixUsersBackend.currentUser.getRoles();
    const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

    if (!isAdmin) {
        throw new Error("Permission Denied: You do not have access to this data.");
    }

    return true;
});

/**
 * Validate member permissions - throws error if user is not logged in
 * @throws {Error} If user is not logged in
 */
export const validateMemberPermissions = webMethod(Permissions.Anyone, async () => {
    const currentUser = wixUsersBackend.currentUser;

    if (!currentUser.loggedIn) {
        throw new Error("Permission Denied: You must be logged in to access this data.");
    }

    return true;
});

/**
 * Get current user ID
 * @returns {Promise<string|null>} User ID or null if not logged in
 */
export const getCurrentUserId = webMethod(Permissions.Anyone, async () => {
    try {
        const currentUser = wixUsersBackend.currentUser;
        return currentUser.loggedIn ? currentUser.id : null;
    } catch (error) {
        console.error("Error getting user ID:", error);
        return null;
    }
});

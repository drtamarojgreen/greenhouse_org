// Version: 1.0.0
import { webMethod, Permissions } from 'wix-web-module';
import wixUsersBackend from 'wix-users-backend';
import wixData from 'wix-data';

console.log("Loading getAppointmentsSecure.web.js - Version 1.0.0");

/**
 * Secure function to retrieve appointments based on user permissions
 * Admin users get full appointment details
 * Regular users get limited public information
 */
export const getAppointments = webMethod(Permissions.SiteMember, async () => {
    try {
        // 1. Securely get the user's roles on the server
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

        if (isAdmin) {
            // 2. Admin users get full appointment data
            console.log("Backend: Admin check passed. Fetching all appointments with full details.");
            const results = await wixData.query("Appointments").find();
            return {
                items: results.items,
                userRole: 'admin',
                totalCount: results.totalCount
            };
        } else {
            // 3. Regular users get limited public data
            console.log("Backend: Regular user. Fetching limited appointment data.");
            const results = await wixData.query("Appointments")
                .eq("status", "available") // Only show available slots
                .ascending("startDate")
                .find();

            // Filter out sensitive information for regular users
            const publicItems = results.items.map(appointment => ({
                _id: appointment._id,
                startDate: appointment.startDate,
                endDate: appointment.endDate,
                therapistName: appointment.therapistName,
                serviceType: appointment.serviceType,
                status: appointment.status,
                duration: appointment.duration
                // Exclude: patientName, patientEmail, patientPhone, notes, etc.
            }));

            return {
                items: publicItems,
                userRole: 'member',
                totalCount: publicItems.length
            };
        }
    } catch (error) {
        console.error("Error in getAppointments:", error);
        throw new Error(error.message || "Failed to retrieve appointments.");
    }
});

/**
 * Get public availability slots (for non-logged-in users)
 */
export const getPublicAvailability = webMethod(Permissions.Anyone, async () => {
    try {
        console.log("Backend: Fetching public availability slots.");
        const results = await wixData.query("Appointments")
            .eq("status", "available")
            .ge("startDate", new Date()) // Only future appointments
            .ascending("startDate")
            .limit(50) // Limit to prevent abuse
            .find();

        // Return only basic scheduling information
        const publicSlots = results.items.map(appointment => ({
            _id: appointment._id,
            startDate: appointment.startDate,
            endDate: appointment.endDate,
            therapistName: appointment.therapistName,
            serviceType: appointment.serviceType,
            duration: appointment.duration
        }));

        return {
            items: publicSlots,
            userRole: 'public',
            totalCount: publicSlots.length
        };
    } catch (error) {
        console.error("Error in getPublicAvailability:", error);
        throw new Error(error.message || "Failed to retrieve availability.");
    }
});

/**
 * Get appointments for a specific user (their own appointments only)
 */
export const getUserAppointments = webMethod(Permissions.SiteMember, async () => {
    try {
        const currentUser = wixUsersBackend.currentUser;
        
        // Validate user is logged in
        if (!currentUser.loggedIn) {
            throw new Error("Permission Denied: You must be logged in to access your appointments.");
        }
        
        const userId = currentUser.id;

        console.log(`Backend: Fetching appointments for user ${userId}`);
        const results = await wixData.query("Appointments")
            .eq("patientId", userId)
            .ascending("startDate")
            .find();

        return {
            items: results.items,
            userRole: 'owner',
            totalCount: results.totalCount
        };
    } catch (error) {
        console.error("Error in getUserAppointments:", error);
        throw new Error(error.message || "Failed to retrieve your appointments.");
    }
});
/**
 * Admin-only function to get all appointment details with sensitive information
 */
export const getAdminAppointments = webMethod(Permissions.SiteMember, async () => {
    try {
        // 1. Validate admin permissions
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");

        if (!isAdmin) {
            throw new Error("Permission Denied: You do not have access to this administrative data.");
        }

        console.log("Backend: Admin fetching all appointments with full details.");
        const results = await wixData.query("Appointments").find();
        
        return {
            items: results.items,
            userRole: 'admin',
            totalCount: results.totalCount
        };
    } catch (error) {
        console.error("Error in getAdminAppointments:", error);
        throw new Error(error.message || "Failed to retrieve administrative appointment data.");
    }
});

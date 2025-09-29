// Version: 1.0.0
import { webMethod, Permissions } from 'wix-web-module';
import wixUsersBackend from 'wix-users-backend';
import wixData from 'wix-data';
import wixCrm from 'wix-crm-backend';

console.log("Loading createAppointmentSecure.web.js - Version 1.0.0");

// Email template ID for appointment confirmations
const CONFIRMATION_EMAIL_ID = 'appointment-confirmation';

/**
 * Secure function to create a new appointment with proper permission validation
 * @param {Object} appointmentData - The appointment data
 */
export const createAppointment = webMethod(Permissions.SiteMember, async (appointmentData) => {
    try {
        // 1. Validate user permissions
        const currentUser = wixUsersBackend.currentUser;
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");
        const userId = currentUser.id;

        // 2. Validate input data
        if (!appointmentData || !appointmentData.therapistId || !appointmentData.startDate) {
            throw new Error("Invalid appointment data: therapistId and startDate are required.");
        }

        // 3. For non-admin users, ensure they can only create appointments for themselves
        if (!isAdmin && appointmentData.patientId && appointmentData.patientId !== userId) {
            throw new Error("Permission Denied: You can only create appointments for yourself.");
        }

        // 4. Set the patient ID to current user if not admin
        if (!isAdmin) {
            appointmentData.patientId = userId;
        }

        console.log(`Backend: Creating appointment for user ${userId}, admin: ${isAdmin}`);

        // 5. Check for double booking
        const { therapistId, startDate } = appointmentData;
        const existingAppointment = await wixData.query("Appointments")
            .eq("therapistId", therapistId)
            .eq("startDate", new Date(startDate))
            .eq("status", "confirmed")
            .find();

        if (existingAppointment.items.length > 0) {
            throw new Error("This time slot is no longer available. Please select another time.");
        }

        // 6. Check user's appointment limits (non-admin users)
        if (!isAdmin) {
            const userAppointments = await wixData.query("Appointments")
                .eq("patientId", userId)
                .eq("status", "confirmed")
                .ge("startDate", new Date())
                .find();

            if (userAppointments.items.length >= 5) { // Max 5 future appointments
                throw new Error("You have reached the maximum number of scheduled appointments. Please cancel an existing appointment first.");
            }
        }

        // 7. Prepare appointment data with security fields
        const secureAppointmentData = {
            ...appointmentData,
            patientId: appointmentData.patientId || userId,
            status: appointmentData.status || "confirmed",
            createdBy: userId,
            createdAt: new Date(),
            lastModifiedBy: userId,
            lastModifiedAt: new Date()
        };

        // 8. Create the appointment
        const insertedAppointment = await wixData.insert("Appointments", secureAppointmentData);

        // 9. Send confirmation email (if patient email is provided)
        if (appointmentData.patientEmail) {
            try {
                const contactInfo = {
                    "name": {
                        "first": appointmentData.patientName ? appointmentData.patientName.split(' ')[0] : "Patient",
                        "last": appointmentData.patientName ? appointmentData.patientName.split(' ').slice(1).join(' ') : ""
                    },
                    "emails": [appointmentData.patientEmail],
                    "phones": appointmentData.patientPhone ? [appointmentData.patientPhone] : []
                };

                const contact = await wixCrm.createContact(contactInfo);

                const emailOptions = {
                    "variables": {
                        "appointmentDate": new Date(insertedAppointment.startDate).toLocaleDateString(),
                        "appointmentTime": new Date(insertedAppointment.startDate).toLocaleTimeString(),
                        "therapistName": insertedAppointment.therapistName || "Your therapist",
                        "serviceType": insertedAppointment.serviceType || "Consultation"
                    }
                };

                await wixCrm.triggeredEmails.emailContact(CONFIRMATION_EMAIL_ID, contact, emailOptions);
                console.log("Confirmation email sent successfully");
            } catch (emailError) {
                console.error("Error sending confirmation email:", emailError);
                // Don't fail the appointment creation if email fails
            }
        }

        // 10. Log the appointment creation for audit
        await wixData.insert("AppointmentAuditLog", {
            appointmentId: insertedAppointment._id,
            action: "created",
            performedBy: userId,
            performedAt: new Date(),
            isAdminAction: isAdmin,
            details: {
                therapistId: appointmentData.therapistId,
                startDate: appointmentData.startDate,
                serviceType: appointmentData.serviceType
            }
        });

        return {
            success: true,
            appointment: insertedAppointment,
            message: "Appointment created successfully.",
            userRole: isAdmin ? 'admin' : 'member'
        };

    } catch (error) {
        console.error("Error creating appointment:", error);
        throw new Error(error.message || "Failed to create appointment due to a server error.");
    }
});

/**
 * Secure function to update an existing appointment
 * @param {string} appointmentId - The appointment ID
 * @param {Object} updateData - The data to update
 */
export const updateAppointment = webMethod(Permissions.SiteMember, async (appointmentId, updateData) => {
    try {
        // 1. Validate user permissions
        const currentUser = wixUsersBackend.currentUser;
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");
        const userId = currentUser.id;

        // 2. Validate input
        if (!appointmentId || !updateData) {
            throw new Error("Invalid parameters: appointmentId and updateData are required.");
        }

        // 3. Get the existing appointment
        const existingAppointment = await wixData.get("Appointments", appointmentId);
        if (!existingAppointment) {
            throw new Error("Appointment not found.");
        }

        // 4. Check permissions - users can only update their own appointments unless admin
        if (!isAdmin && existingAppointment.patientId !== userId) {
            throw new Error("Permission Denied: You can only update your own appointments.");
        }

        console.log(`Backend: Updating appointment ${appointmentId} by user ${userId}, admin: ${isAdmin}`);

        // 5. Prepare secure update data
        const secureUpdateData = {
            ...updateData,
            lastModifiedBy: userId,
            lastModifiedAt: new Date()
        };

        // 6. Prevent non-admin users from changing certain fields
        if (!isAdmin) {
            delete secureUpdateData.patientId;
            delete secureUpdateData.createdBy;
            delete secureUpdateData.createdAt;
            // Only allow status changes to 'cancelled' for regular users
            if (secureUpdateData.status && secureUpdateData.status !== 'cancelled') {
                delete secureUpdateData.status;
            }
        }

        // 7. Update the appointment
        secureUpdateData._id = appointmentId;
        const updatedAppointment = await wixData.update("Appointments", secureUpdateData);

        // 8. Log the update for audit
        await wixData.insert("AppointmentAuditLog", {
            appointmentId: appointmentId,
            action: "updated",
            performedBy: userId,
            performedAt: new Date(),
            isAdminAction: isAdmin,
            details: updateData
        });

        return {
            success: true,
            appointment: updatedAppointment,
            message: "Appointment updated successfully.",
            userRole: isAdmin ? 'admin' : 'member'
        };

    } catch (error) {
        console.error("Error updating appointment:", error);
        throw new Error(error.message || "Failed to update appointment.");
    }
});

/**
 * Secure function to cancel an appointment
 * @param {string} appointmentId - The appointment ID
 * @param {string} reason - Cancellation reason
 */
export const cancelAppointment = webMethod(Permissions.SiteMember, async (appointmentId, reason = "Cancelled by user") => {
    try {
        // 1. Validate user permissions
        const currentUser = wixUsersBackend.currentUser;
        const roles = await wixUsersBackend.currentUser.getRoles();
        const isAdmin = roles.some(r => r.name === "Administrator" || r.name === "Developer");
        const userId = currentUser.id;

        // 2. Validate input
        if (!appointmentId) {
            throw new Error("Invalid parameters: appointmentId is required.");
        }

        // 3. Get the existing appointment
        const existingAppointment = await wixData.get("Appointments", appointmentId);
        if (!existingAppointment) {
            throw new Error("Appointment not found.");
        }

        // 4. Check permissions
        if (!isAdmin && existingAppointment.patientId !== userId) {
            throw new Error("Permission Denied: You can only cancel your own appointments.");
        }

        console.log(`Backend: Cancelling appointment ${appointmentId} by user ${userId}, admin: ${isAdmin}`);

        // 5. Update appointment status
        const updatedItem = {
            _id: appointmentId,
            status: "cancelled",
            cancellationReason: reason,
            cancelledBy: userId,
            cancelledAt: new Date(),
            lastModifiedBy: userId,
            lastModifiedAt: new Date()
        };
        const updatedAppointment = await wixData.update("Appointments", updatedItem);

        // 6. Log the cancellation for audit
        await wixData.insert("AppointmentAuditLog", {
            appointmentId: appointmentId,
            action: "cancelled",
            performedBy: userId,
            performedAt: new Date(),
            isAdminAction: isAdmin,
            details: { reason: reason }
        });

        return {
            success: true,
            appointment: updatedAppointment,
            message: "Appointment cancelled successfully.",
            userRole: isAdmin ? 'admin' : 'member'
        };

    } catch (error) {
        console.error("Error cancelling appointment:", error);
        throw new Error(error.message || "Failed to cancel appointment.");
    }
});

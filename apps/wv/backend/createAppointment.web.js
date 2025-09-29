import wixData from 'wix-data';
import { response } from 'wix-http-functions';
import wixCrm from 'wix-crm-backend';

// This is the ID of a triggered email template created in the Wix dashboard.
// It's assumed that this template exists and has variables for appointment details.
const CONFIRMATION_EMAIL_ID = 'appointment-confirmation';

/**
 * HTTP POST function to create a new appointment.
 * Endpoint: /_functions/createAppointment
 */
export async function post(request) {
    try {
        const appointmentData = await request.body.json();

        // --- 1. Prevent Double Booking ---
        const { therapistId, startDate } = appointmentData;
        const existingAppointment = await wixData.query("Appointments")
            .eq("therapistId", therapistId)
            .eq("startDate", new Date(startDate))
            .find();

        if (existingAppointment.items.length > 0) {
            // This time slot is already booked.
            return response({
                status: 409, // 409 Conflict
                headers: { "Content-Type": "application/json" },
                body: { message: "This time slot is no longer available. Please select another time." }
            });
        }

        // --- 2. Create the Appointment ---
        const insertedAppointment = await wixData.insert("Appointments", appointmentData);

        // --- 3. Send Confirmation Email ---
        // First, create or update a contact for the user.
        const contactInfo = {
            "name": {
                "first": appointmentData.patientName.split(' ')[0],
                "last": appointmentData.patientName.split(' ').slice(1).join(' ')
            },
            "emails": [appointmentData.patientEmail],
            "phones": [appointmentData.patientPhone]
        };

        const contact = await wixCrm.createContact(contactInfo);

        // Then, send the triggered email.
        // The email template can use variables like {{contact.name.first}} and others.
        // We can pass additional variables specific to this appointment.
        const emailOptions = {
            "variables": {
                "appointmentDate": new Date(insertedAppointment.startDate).toLocaleDateString(),
                "appointmentTime": new Date(insertedAppointment.startDate).toLocaleTimeString(),
                "therapistName": insertedAppointment.therapistName // Assuming this is passed in appointmentData
            }
        };

        await wixCrm.triggeredEmails.emailContact(CONFIRMATION_EMAIL_ID, contact, emailOptions);

        // --- 4. Return Success Response ---
        return response({
            status: 200, // OK
            headers: { "Content-Type": "application/json" },
            body: insertedAppointment
        });

    } catch (error) {
        console.error("Error creating appointment via HTTP Function:", error);
        return response({
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: { message: "Failed to create appointment due to a server error." }
        });
    }
}

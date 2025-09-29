# Wix to Google Cloud Platform Migration Plan

## Executive Summary

Migrating a website from Wix to Google Cloud Platform (GCP) is not a direct "lift-and-shift" operation due to Wix's proprietary nature, including its Velo API, integrated editor, and managed backend services (like Wix Data and Wix Bookings). Instead, it requires a **re-platforming strategy**, where existing functionalities are re-implemented using GCP's robust, scalable, and flexible cloud services.

This document outlines a comprehensive plan to migrate key features – Booking, Services, and Chat – from a Wix-based implementation to Google Cloud Platform. The goal is to leverage GCP's strengths in scalability, performance, cost-efficiency, and developer control, while re-implementing the core business logic and user experience.

## Overall Migration Strategy

The migration will follow a phased approach, focusing on re-implementing the frontend and backend components using modern, cloud-native architectures.

1.  **Decoupled Architecture:** Separate the frontend (user interface) from the backend (business logic, data storage, APIs). This allows for independent development, scaling, and deployment.
2.  **Serverless First:** Prioritize serverless computing (Cloud Functions, Cloud Run) for backend logic to minimize operational overhead, enable automatic scaling, and optimize costs.
3.  **Managed Databases:** Utilize GCP's managed database services (Firestore, Cloud SQL) for data persistence, ensuring high availability, scalability, and reduced administrative burden.
4.  **Modern Frontend Framework:** Re-implement the frontend using a popular JavaScript framework (e.g., React, Vue, Angular) for enhanced developer experience, performance, and maintainability.
5.  **API-Driven Communication:** All frontend-to-backend communication will occur via well-defined APIs, typically exposed through an API Gateway.
6.  **CI/CD Integration:** Implement Continuous Integration/Continuous Deployment (CI/CD) pipelines using Cloud Build to automate testing, building, and deployment processes.

## Feature-Specific Migration Plans

### 1. Booking Feature

**Current Wix Dependencies:**
*   Wix Bookings app for scheduling, calendar management, and appointment data.
*   Wix Forms for user input.
*   Potentially Velo backend functions for custom booking logic or integrations.
*   Wix UI elements (`$w` API) for frontend interaction.

**Proposed GCP Services:**
*   **Frontend:** Re-implemented using a modern JavaScript framework (e.g., React) hosted on **Firebase Hosting** (for SPA benefits like CDN, SSL) or **Cloud Storage** (for static site hosting).
*   **Backend (API):** **Cloud Functions (Node.js/Python)** for handling booking requests, availability checks, and appointment management. Each API endpoint (e.g., `createAppointment`, `getAvailability`, `updateAppointmentStatus`) would be a separate Cloud Function.
*   **Database:** **Firestore (NoSQL Document Database)** for storing appointment details, therapist availability, service configurations, and user booking history. Its real-time capabilities are beneficial for calendar updates.
*   **Calendar Integration (Optional):** Google Calendar API for syncing with external calendars (e.g., therapists' personal calendars).
*   **Email Notifications:** SendGrid or Firebase Extensions for sending booking confirmations and reminders.

**Re-implementation Steps:**

1.  **Data Model Design:** Design a robust data model for appointments, services, therapists, and availability in Firestore.
2.  **Backend API Development (Cloud Functions):**
    *   Create Cloud Functions for core booking operations:
        *   `createAppointment(appointmentData)`: Handles new booking requests, checks for conflicts, and saves to Firestore.
        *   `getAvailability(therapistId, dateRange)`: Queries Firestore for therapist availability.
        *   `updateAppointmentStatus(appointmentId, status)`: Changes appointment status (confirmed, cancelled).
        *   `getAppointments(userId/therapistId)`: Retrieves user/therapist-specific appointments.
    *   Implement validation and error handling within each function.
    *   Integrate with Google Calendar API if external syncing is required.
3.  **Frontend UI Development:**
    *   Design and build responsive UI components for:
        *   Service selection.
        *   Therapist selection.
        *   Date and time slot selection (a custom calendar component).
        *   Appointment request form.
        *   User's upcoming appointments display.
        *   Admin dashboard for managing appointments and conflicts.
    *   Replace all `$w` API calls with standard JavaScript DOM manipulation or framework-specific methods.
    *   Integrate frontend with the new Cloud Functions APIs.
4.  **Deployment:**
    *   Deploy Cloud Functions.
    *   Deploy the frontend application to Firebase Hosting or Cloud Storage.
5.  **Testing:** Thoroughly test all booking flows, including edge cases like conflicts, cancellations, and different user roles.

**Conceptual Code Snippet (Cloud Function for `createAppointment`):**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

exports.createAppointment = functions.https.onCall(async (data, context) => {
    // 1. Authentication (optional, if user is logged in)
    // if (!context.auth) {
    //     throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    const { title, date, time, platform, serviceRef, therapistId, userId } = data;

    // Basic validation
    if (!title || !date || !time || !serviceRef || !therapistId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required appointment fields.');
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Assuming 1-hour slots

    // 2. Check for conflicts (simplified example)
    const conflicts = await db.collection('appointments')
        .where('therapistId', '==', therapistId)
        .where('start', '<', endDateTime)
        .where('end', '>', startDateTime)
        .get();

    if (!conflicts.empty) {
        throw new functions.https.HttpsError('already-exists', 'Scheduling conflict detected.');
    }

    // 3. Create appointment
    const newAppointment = {
        title,
        start: startDateTime,
        end: endDateTime,
        platform,
        serviceRef,
        therapistId,
        userId: userId || null, // Associate with user if authenticated
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('appointments').add(newAppointment);

    // 4. Send confirmation email (conceptual)
    // await sendEmailConfirmation(newAppointment, docRef.id);

    return { id: docRef.id, message: 'Appointment created successfully.' };
});
```

### 2. Services Feature

**Current Wix Dependencies:**
*   Wix Data collections for storing service details (name, description, duration, price).
*   Wix UI elements (`$w` API) for displaying service lists and details.
*   Potentially Velo backend functions for custom service logic.

**Proposed GCP Services:**
*   **Frontend:** Re-implemented using a modern JavaScript framework hosted on **Firebase Hosting** or **Cloud Storage**.
*   **Backend (API):** **Cloud Functions** for fetching and managing service data.
*   **Database:** **Firestore** for storing service details.

**Re-implementation Steps:**

1.  **Data Model Design:** Define a Firestore collection for `services` with fields like `name`, `description`, `duration`, `price`, `therapistRefs` (if services are linked to specific therapists).
2.  **Backend API Development (Cloud Functions):**
    *   `getServices()`: Retrieves all available services from Firestore.
    *   `getServiceById(serviceId)`: Fetches details for a specific service.
    *   `createService(serviceData)`, `updateService(serviceId, serviceData)`, `deleteService(serviceId)`: Admin functions for managing services.
3.  **Frontend UI Development:**
    *   Build components to display a list of services.
    *   Create detailed service pages.
    *   Integrate with the new Cloud Functions APIs to fetch and display service data.
4.  **Deployment:** Deploy Cloud Functions and update frontend.

**Conceptual Code Snippet (Cloud Function for `getServices`):**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
// admin.initializeApp(); // Already initialized in createAppointment example
const db = admin.firestore();

exports.getServices = functions.https.onCall(async (data, context) => {
    const servicesSnapshot = await db.collection('services').get();
    const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { services };
});
```

### 3. Chat Feature

**Current Wix Dependencies:**
*   Wix Chat app for live chat functionality.
*   Potentially Wix Automations for chat-related triggers.

**Proposed GCP Services:**
*   **Frontend:** Re-implemented using a modern JavaScript framework.
*   **Backend (Real-time Messaging):** **Firebase Realtime Database** or **Firestore** with real-time listeners for chat message storage and delivery.
*   **Backend (Chat Logic):** **Cloud Functions** for handling chat message processing, user presence, and notifications.
*   **User Authentication:** **Firebase Authentication** for managing chat user identities.

**Re-implementation Steps:**

1.  **Authentication:** Implement user authentication using Firebase Authentication.
2.  **Data Model Design:** Design a data model for chat rooms, messages, and user presence in Firebase Realtime Database or Firestore.
    *   Example: `chats/{chatId}/messages/{messageId}` and `users/{userId}/presence`.
3.  **Backend Logic (Cloud Functions):**
    *   `sendMessage(chatId, messageData)`: Stores messages in the database and triggers real-time updates.
    *   `updateUserPresence(userId, status)`: Updates user online/offline status.
    *   `createChatRoom(userIds)`: Creates new private or group chat rooms.
    *   Integrate with Firebase Cloud Messaging (FCM) for push notifications.
4.  **Frontend UI Development:**
    *   Build chat interface components: chat list, message input, message display with real-time updates.
    *   Integrate with Firebase Realtime Database/Firestore SDKs for real-time data synchronization.
    *   Integrate with Firebase Authentication for user login.
5.  **Deployment:** Deploy Cloud Functions and the frontend application.

**Conceptual Code Snippet (Frontend Chat Message Sending - React example):**

```javascript
// Example React component for sending messages
import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

const functions = getFunctions();
const sendMessageCallable = httpsCallable(functions, 'sendMessage');

function ChatInput({ chatId }) {
    const [message, setMessage] = useState('');
    const auth = getAuth();
    const user = auth.currentUser;

    const handleSendMessage = async () => {
        if (message.trim() && user) {
            try {
                await sendMessageCallable({
                    chatId,
                    text: message,
                    senderId: user.uid,
                    senderName: user.displayName || 'Anonymous'
                });
                setMessage('');
            } catch (error) {
                console.error("Error sending message:", error);
                // Display error to user
            }
        }
    };

    return (
        <div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
            />
            <button onClick={handleSendMessage}>Send</button>
        </div>
    );
}
```

## Conclusion

Migrating from Wix to Google Cloud Platform is a strategic move that offers significant benefits in terms of control, scalability, and flexibility. While it requires a re-implementation effort rather than a simple transfer, GCP provides a comprehensive suite of services perfectly suited for building modern, high-performance web applications. By adopting a decoupled, serverless-first architecture with managed databases, the Greenhouse Mental Health website can achieve a robust, future-proof foundation for its booking, services, and chat functionalities. This plan demonstrates a clear path forward, leveraging industry best practices and powerful cloud technologies.

# Wix to AWS EC2 Migration Plan

## Executive Summary

Migrating a website from Wix to AWS EC2 (Amazon Elastic Compute Cloud) is a significant undertaking that involves **re-platforming** rather than a direct transfer. Wix is a proprietary, tightly integrated platform, meaning its Velo API, built-in editor, and managed services (like Wix Bookings and Wix Chat) are not directly portable to AWS. This plan outlines a comprehensive strategy to re-implement the core functionalities – Booking, Services, and Chat – using AWS EC2 as the central compute resource, complemented by other AWS services for a robust, scalable, and maintainable architecture.

The goal is to move from a managed, opinionated Wix environment to a flexible, infrastructure-as-a-service (IaaS) model on AWS, providing greater control, customization, and scalability, while optimizing for performance and cost.

## Overall Migration Strategy (AWS EC2-Centric)

The migration will adopt a modern, decoupled architecture, with EC2 instances forming the backbone of the backend application.

1.  **Decoupled Frontend & Backend:** The frontend (user interface) will be separated from the backend (application logic, data access).
2.  **EC2 as Core Compute:** Backend application logic will primarily run on EC2 instances, offering full control over the operating system, software stack, and runtime environment.
3.  **Managed AWS Services:** Complement EC2 with managed AWS services for databases (RDS, DynamoDB), static asset hosting (S3, CloudFront), API management (API Gateway), and serverless tasks (Lambda) to reduce operational burden where appropriate.
4.  **API-Driven Communication:** Frontend and backend will communicate via RESTful APIs, secured and potentially managed by AWS API Gateway.
5.  **Scalability & High Availability:** Design for horizontal scalability using EC2 Auto Scaling Groups and Elastic Load Balancing (ELB) across multiple Availability Zones.
6.  **CI/CD Pipeline:** Implement automated Continuous Integration/Continuous Deployment using AWS CodePipeline, CodeBuild, and CodeDeploy for efficient and reliable software delivery.
7.  **Monitoring & Logging:** Utilize Amazon CloudWatch for comprehensive monitoring and logging of application and infrastructure performance.

## Feature-Specific Migration Plans

### 1. Booking Feature

**Current Wix Dependencies:**
*   Wix Bookings app: Handles scheduling, calendar views, appointment creation, and management.
*   Wix Data: Stores appointment, service, and therapist information.
*   Velo Backend Functions: Custom logic for booking flows, validations, or external integrations.
*   Wix UI Elements (`$w` API): Frontend forms, calendars, and displays.

**Proposed AWS Services & Re-implementation:**

*   **Frontend (Client-Side Application):**
    *   **Technology:** Modern JavaScript framework (e.g., React, Vue, Angular).
    *   **Hosting:** **Amazon S3** for static asset storage, integrated with **Amazon CloudFront** for global CDN delivery and SSL.
    *   **Interaction:** Communicates with the backend APIs hosted on EC2.
    *   **Re-implementation:** Build custom UI for service selection, therapist availability, calendar views, appointment forms, and user/admin dashboards. This replaces all `$w` API interactions.

*   **Backend (Application Server on EC2):**
    *   **Compute:** **AWS EC2 Instance(s)** running a Node.js (e.g., Express.js), Python (e.g., Django/Flask), or Java (e.g., Spring Boot) application server.
    *   **Scalability:** **EC2 Auto Scaling Group** behind an **Elastic Load Balancer (ELB)** to distribute traffic and automatically adjust capacity based on demand.
    *   **API Endpoints:** The application server on EC2 will expose RESTful APIs for all booking operations.
    *   **Re-implementation:** Translate Velo backend booking logic into application server routes and controllers.

*   **Database:**
    *   **Option A (Relational): Amazon RDS (PostgreSQL/MySQL):** Ideal for structured booking data, complex queries, and transactional integrity.
    *   **Option B (NoSQL): Amazon DynamoDB:** Suitable for high-performance, key-value, and document data, especially if booking data access patterns are simple and high-volume.
    *   **Data Model:** Design tables/collections for `Appointments`, `Services`, `Therapists`, `AvailabilitySlots`, `Users`.

*   **Calendar Integration:**
    *   **Google Calendar API:** Integrate with Google Calendar for syncing therapist availability and booking events. This would be handled by the EC2 backend application.

*   **Notifications:**
    *   **Amazon SES (Simple Email Service):** For sending booking confirmations, reminders, and cancellations.
    *   **Amazon SNS (Simple Notification Service):** For push notifications (if mobile app integration is planned).

**Detailed Re-implementation Steps:**

1.  **Database Setup:**
    *   Provision an **Amazon RDS** instance (e.g., PostgreSQL) or create **DynamoDB** tables.
    *   Define schemas for `Appointments`, `Services`, `Therapists`, `AvailabilitySlots`, `Users`.
    *   Migrate existing Wix booking data (if exportable) into the new database.

2.  **Backend Application Development (EC2):**
    *   **Choose Framework:** Select a backend framework (e.g., Node.js with Express.js).
    *   **EC2 Setup:**
        *   Launch an EC2 instance (e.g., `t3.medium`).
        *   Install necessary runtime (Node.js, Python, Java) and dependencies.
        *   Configure security groups to allow inbound traffic on relevant ports (e.g., 80/443 for HTTP/S, 22 for SSH).
        *   Set up **IAM roles** for EC2 to securely access other AWS services (RDS, DynamoDB, SES).
    *   **API Implementation:**
        *   Develop RESTful API endpoints (e.g., `/api/bookings`, `/api/services`, `/api/therapists`).
        *   Implement business logic for:
            *   `POST /api/bookings`: Create new appointments, including availability checks and conflict detection.
            *   `GET /api/bookings/{id}`: Retrieve specific appointment details.
            *   `PUT /api/bookings/{id}`: Update appointment status (e.g., confirm, cancel).
            *   `GET /api/availability?therapistId={id}&date={date}`: Fetch available slots.
        *   Integrate with RDS/DynamoDB for data persistence.
        *   Integrate with Google Calendar API for external calendar syncing.
        *   Integrate with Amazon SES for email notifications.
    *   **Scalability & High Availability:**
        *   Create an **Amazon Machine Image (AMI)** of the configured EC2 instance.
        *   Set up an **Auto Scaling Group** using the AMI, distributing instances across multiple Availability Zones.
        *   Place the Auto Scaling Group behind an **Application Load Balancer (ALB)** for traffic distribution and SSL termination.

3.  **Frontend Application Development:**
    *   Develop the SPA using React/Vue/Angular.
    *   Replace all Wix `$w` API calls with direct API calls to the new EC2 backend endpoints.
    *   Build UI components for all booking-related interactions.

4.  **Deployment (CI/CD):**
    *   Set up **AWS CodePipeline** to orchestrate the deployment.
    *   **AWS CodeBuild** for building the frontend (e.g., `npm run build`) and backend (e.g., packaging Node.js app).
    *   **AWS CodeDeploy** for deploying the backend application to EC2 instances within the Auto Scaling Group.
    *   Frontend deployment: CodeBuild pushes static assets to S3, triggering CloudFront invalidation.

**Conceptual Code Snippet (Express.js Backend on EC2 for `createAppointment`):**

```javascript
// backend/src/routes/booking.js (running on EC2)
const express = require('express');
const router = express.Router();
const { Pool } = require('pg'); // Example for PostgreSQL with RDS
const pool = new Pool({ /* RDS connection config */ });

router.post('/appointments', async (req, res) => {
    // Basic authentication/authorization middleware would go here
    // if (!req.user) return res.status(401).send('Unauthorized');

    const { title, date, time, platform, serviceRef, therapistId, userId } = req.body;

    if (!title || !date || !time || !serviceRef || !therapistId) {
        return res.status(400).send('Missing required appointment fields.');
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    try {
        // Check for conflicts in RDS
        const conflictCheck = await pool.query(
            `SELECT COUNT(*) FROM appointments WHERE therapist_id = $1 AND start_time < $2 AND end_time > $3`,
            [therapistId, endDateTime, startDateTime]
        );

        if (conflictCheck.rows[0].count > 0) {
            return res.status(409).send('Scheduling conflict detected.');
        }

        // Insert new appointment into RDS
        const result = await pool.query(
            `INSERT INTO appointments (title, start_time, end_time, platform, service_ref, therapist_id, user_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [title, startDateTime, endDateTime, platform, serviceRef, therapistId, userId, 'pending']
        );

        const newAppointmentId = result.rows[0].id;

        // Send confirmation email via AWS SES (conceptual)
        // await sendEmailViaSES({ to: user.email, subject: 'Booking Confirmation', body: `Your appointment ${title} is confirmed!` });

        res.status(201).json({ id: newAppointmentId, message: 'Appointment created successfully.' });

    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
```

### 2. Services Feature

**Current Wix Dependencies:**
*   Wix Data collections: Stores service details (name, description, duration, price).
*   Velo Backend Functions: Custom logic for fetching/managing services.
*   Wix UI Elements (`$w` API): Displaying service lists and details.

**Proposed AWS Services & Re-implementation:**

*   **Frontend:** Re-implemented SPA hosted on S3/CloudFront.
*   **Backend (Application Server on EC2):**
    *   EC2 instance(s) running the application server.
    *   Exposes RESTful APIs for service data.
    *   **Re-implementation:** Translate Velo backend service logic into application server routes.
*   **Database:** **Amazon RDS (PostgreSQL/MySQL)** or **DynamoDB** for storing service details.

**Detailed Re-implementation Steps:**

1.  **Database Setup:**
    *   Create a `services` table/collection in RDS/DynamoDB.
    *   Migrate existing Wix service data.
2.  **Backend API Development (EC2):**
    *   Add API endpoints to the EC2 application server:
        *   `GET /api/services`: Retrieve all services.
        *   `GET /api/services/{id}`: Retrieve details for a specific service.
        *   `POST /api/services`, `PUT /api/services/{id}`, `DELETE /api/services/{id}`: Admin APIs for CRUD operations.
3.  **Frontend UI Development:**
    *   Build UI components to display service lists and detailed service pages.
    *   Integrate with the new EC2 backend APIs to fetch and display service data.
4.  **Deployment:** Integrate into the existing CI/CD pipeline.

**Conceptual Code Snippet (Express.js Backend on EC2 for `getServices`):**

```javascript
// backend/src/routes/services.js (running on EC2)
const express = require('express');
const router = express.Router();
const { Pool } = require('pg'); // Example for PostgreSQL with RDS
const pool = new Pool({ /* RDS connection config */ });

router.get('/services', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM services');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
```

### 3. Chat Feature

**Current Wix Dependencies:**
*   Wix Chat app: Provides live chat functionality.
*   Wix Automations: Potentially triggers related to chat events.

**Proposed AWS Services & Re-implementation:**

*   **Frontend:** Re-implemented SPA hosted on S3/CloudFront.
*   **Backend (Real-time Messaging & Logic):**
    *   **AWS EC2 Instance(s) with WebSocket Server:** For persistent, real-time connections. A Node.js application (e.g., using `ws` or Socket.IO) running on EC2 would manage WebSocket connections.
    *   **Amazon DynamoDB:** For storing chat messages, chat room metadata, and user presence. DynamoDB Streams can be used to trigger Lambda functions for post-message processing.
    *   **AWS Lambda:** Triggered by DynamoDB Streams for asynchronous tasks like sending push notifications (via SNS) or archiving messages.
    *   **Amazon SQS (Simple Queue Service) / SNS (Simple Notification Service):** For inter-service communication (e.g., notifying users of new messages, handling offline messages).
*   **User Authentication:** **Amazon Cognito** for managing chat user identities and authentication.

**Detailed Re-implementation Steps:**

1.  **Authentication Setup:** Implement user authentication using **Amazon Cognito User Pools**.
2.  **Database Setup:**
    *   Create DynamoDB tables for `ChatMessages` (partition key: `chatId`, sort key: `timestamp`) and `ChatRooms`.
    *   Enable DynamoDB Streams on `ChatMessages` table.
3.  **Backend WebSocket Server (EC2):**
    *   Develop a Node.js (or other language) WebSocket server application.
    *   Deploy this application to **EC2 instances** within an Auto Scaling Group behind an ELB.
    *   The WebSocket server will:
        *   Handle WebSocket connections from frontend clients.
        *   Receive messages from clients and write them to DynamoDB.
        *   Read messages from DynamoDB (or DynamoDB Streams) and broadcast them to connected clients in real-time.
        *   Manage user presence (online/offline status) in DynamoDB.
    *   Configure security groups to allow WebSocket traffic (e.g., port 80/443).
4.  **Backend Serverless Logic (Lambda):**
    *   Create **AWS Lambda functions** triggered by DynamoDB Streams on `ChatMessages`.
    *   These Lambda functions can:
        *   Send push notifications to offline users via **Amazon SNS**.
        *   Perform sentiment analysis on messages.
        *   Archive old messages to S3.
5.  **Frontend UI Development:**
    *   Build chat interface components: chat list, message display, message input.
    *   Integrate with the WebSocket server on EC2 for real-time communication.
    *   Integrate with Amazon Cognito for user login.
6.  **Deployment:** Integrate into the CI/CD pipeline.

**Conceptual Code Snippet (Node.js WebSocket Server on EC2 for Chat):**

```javascript
// backend/src/websocket-server.js (running on EC2)
const WebSocket = require('ws');
const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb'); // AWS SDK v3
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const wss = new WebSocket.Server({ port: 8080 }); // Or integrate with Express.js server
const ddbClient = new DynamoDBClient({ region: 'us-east-1' }); // Configure your AWS region

wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', async message => {
        const parsedMessage = JSON.parse(message);
        const { chatId, senderId, senderName, text } = parsedMessage;

        if (chatId && senderId && text) {
            const timestamp = new Date().toISOString();
            const params = {
                TableName: 'ChatMessages', // Your DynamoDB table name
                Item: marshall({
                    chatId,
                    timestamp,
                    senderId,
                    senderName,
                    text
                })
            };

            try {
                await ddbClient.send(new PutItemCommand(params));
                console.log('Message saved to DynamoDB');

                // Broadcast message to all connected clients in the same chat (simplified)
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(parsedMessage));
                    }
                });
            } catch (error) {
                console.error('Error processing message:', error);
                ws.send(JSON.stringify({ error: 'Failed to send message.' }));
            }
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
    ws.on('error', error => console.error('WebSocket error:', error));
});

console.log('WebSocket server started on port 8080');
```

## Conclusion

Migrating the Greenhouse Mental Health website from Wix to AWS EC2 is a strategic decision that unlocks significant potential for customization, scalability, and performance. This detailed plan outlines a robust re-platforming approach, leveraging EC2 as the core compute for backend applications, complemented by specialized AWS services like S3/CloudFront for frontend, RDS/DynamoDB for databases, Lambda for serverless tasks, and Cognito for authentication. By meticulously re-implementing each feature with these AWS-native solutions, the website can achieve a highly available, resilient, and future-proof architecture, providing a superior foundation for growth and innovation. This approach moves beyond generic cloud concepts to provide concrete, actionable steps for a successful migration.

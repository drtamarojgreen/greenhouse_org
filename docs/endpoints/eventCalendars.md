# Event Calendars Service Endpoints

This document details the backend functions exposed by the `eventCalendars.jsw` web module, accessible from the Wix Velo frontend.

## `getEvents(filter)`

### Description
Retrieves a list of mental health events, workshops, and seminars. Can be filtered by various criteria.

### Parameters
-   `filter`: (Object, optional) An object containing properties to filter the events.
    -   `category`: (String, optional) Filters events by category (e.g., "Workshop", "Community Event", "Support Group").
    -   (Additional filter properties like `startDate`, `endDate`, `keyword` can be added in a full implementation).

### Returns
`Promise<Array<Object>>` - A promise that resolves to an array of event objects. Each object typically contains:
-   `id`: (String) Unique identifier for the event.
-   `title`: (String) The title of the event.
-   `date`: (String) The date and time of the event (ISO 8601 format).
-   `location`: (String) The location of the event (e.g., "Online (Zoom)", "Community Center Hall").
-   `description`: (String) A brief description of the event.
-   `category`: (String) The category of the event.
-   `tags`: (Array<String>) An array of keywords or tags associated with the event.

### Example Frontend Usage
```javascript
import { getEvents } from 'backend/eventCalendars';

async function fetchWorkshops() {
  try {
    const workshops = await getEvents({ category: "Workshop" });
    console.log('Upcoming Workshops:', workshops);
  } catch (error) {
    console.error('Failed to fetch workshops:', error);
  }
}

async function fetchAllEvents() {
  try {
    const allEvents = await getEvents();
    console.log('All Events:', allEvents);
  } catch (error) {
    console.error('Failed to fetch events:', error);
  }
}
```

---

## `getEventById(eventId)`

### Description
Retrieves the details of a specific event by its unique identifier.

### Parameters
-   `eventId`: (String, required) The unique ID of the event to retrieve.

### Returns
`Promise<Object>` - A promise that resolves to an event object, or `undefined` if not found.

### Example Frontend Usage
```javascript
import { getEventById } from 'backend/eventCalendars';

async function fetchSpecificEvent() {
  const eventData = await getEventById('1');
  if (eventData) {
    console.log('Loaded Event:', eventData.title);
  } else {
    console.log('Event not found.');
  }
}
```

---

## `registerForEvent(eventId, registrationDetails)`

### Description
Allows a user to register for a specific event. In a real application, this would typically involve saving registration details and potentially integrating with an event management system.

### Parameters
-   `eventId`: (String, required) The ID of the event the user is registering for.
-   `registrationDetails`: (Object, required) An object containing the user's registration information (e.g., `name`, `email`, `phone`).

### Returns
`Promise<Object>` - A promise that resolves to an object indicating the success or failure of the registration.
-   `success`: (Boolean) `true` if registration was successful, `false` otherwise.
-   `message`: (String) A descriptive message about the registration outcome.

### Example Frontend Usage
```javascript
import { registerForEvent } from 'backend/eventCalendars';

async function handleEventRegistration() {
  const eventId = '1'; // Example event ID
  const userDetails = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '555-123-4567'
  };
  try {
    const result = await registerForEvent(eventId, userDetails);
    if (result.success) {
      console.log(result.message);
    } else {
      console.error('Registration failed:', result.message);
    }
  } catch (error) {
    console.error('Error during registration:', error);
  }
}
```
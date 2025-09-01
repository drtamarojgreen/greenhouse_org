const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from current directory

// In-memory data store for events (renamed from appointments for consistency)
let events = [];
let nextEventId = 1;

// Mock services and their events
const services = {
    'serviceA': { name: 'Service A', events: [] },
    'serviceB': { name: 'Service B', events: [] }
};

// Helper to generate unique IDs
const generateId = () => nextEventId++;

// Helper to check for conflicts
const checkConflict = (newEvent) => {
    const conflicts = [];
    const newEventStart = new Date(newEvent.start);
    const newEventEnd = new Date(newEvent.end);
    const targetServiceId = newEvent.serviceId;

    if (!services[targetServiceId]) {
        // If the service doesn't exist, there can't be any conflicts within it.
        return [];
    }

    services[targetServiceId].events.forEach(existingEvent => {
        const existingEventStart = new Date(existingEvent.start);
        const existingEventEnd = new Date(existingEvent.end);

        // Check for overlap
        if (
            (newEventStart < existingEventEnd && newEventEnd > existingEventStart) &&
            (newEvent.id !== existingEvent.id) // Don't conflict with itself during update
        ) {
            conflicts.push({
                type: 'time_overlap',
                proposedEvent: newEvent,
                conflictingEvent: { ...existingEvent, serviceId: targetServiceId }
            });
        }
    });
    return conflicts;
};

// API Endpoints

// GET /api/events - Get all events from all services
app.get('/api/events', (req, res) => {
    let allEvents = [];
    for (const serviceId in services) {
        allEvents = allEvents.concat(services[serviceId].events.map(event => ({ ...event, serviceId })));
    }
    res.json(allEvents);
});

// POST /api/events/propose - Propose a new event and check for conflicts
app.post('/api/events/propose', (req, res) => {
    const proposedEvent = { ...req.body, id: req.body.id || generateId() }; // Use existing ID for updates, new for creation
    const conflicts = checkConflict(proposedEvent);

    if (conflicts.length > 0) {
        res.status(409).json({ // 409 Conflict
            message: 'Proposed event conflicts with existing events.',
            proposedEvent: proposedEvent,
            conflicts: conflicts
        });
    } else {
        // If no conflicts, we can proceed to add/update the event
        // For now, we just return success. Actual addition/update happens via /api/events POST/PUT
        res.status(200).json({
            message: 'No conflicts detected.',
            proposedEvent: proposedEvent
        });
    }
});

// POST /api/events - Add a new event to a specific service
app.post('/api/events', (req, res) => {
    const { serviceId, ...newEvent } = req.body;
    if (!serviceId || !services[serviceId]) {
        return res.status(400).json({ message: 'Invalid serviceId provided.' });
    }

    const eventToAdd = { ...newEvent, id: generateId() };
    services[serviceId].events.push(eventToAdd);
    res.status(201).json(eventToAdd);
});

// PUT /api/events/:id - Update an event in its respective service
app.put('/api/events/:id', (req, res) => {
    const eventId = parseInt(req.params.id);
    const updatedEventData = req.body;
    let found = false;

    for (const serviceId in services) {
        const index = services[serviceId].events.findIndex(e => e.id === eventId);
        if (index !== -1) {
            services[serviceId].events[index] = { ...services[serviceId].events[index], ...updatedEventData, id: eventId };
            found = true;
            return res.json(services[serviceId].events[index]);
        }
    }

    if (!found) {
        res.status(404).json({ message: 'Event not found.' });
    }
});

// DELETE /api/events/:id - Delete an event from its respective service
app.delete('/api/events/:id', (req, res) => {
    const eventId = parseInt(req.params.id);
    let found = false;

    for (const serviceId in services) {
        const initialLength = services[serviceId].events.length;
        services[serviceId].events = services[serviceId].events.filter(e => e.id !== eventId);
        if (services[serviceId].events.length < initialLength) {
            found = true;
            return res.status(204).send(); // No Content
        }
    }

    if (!found) {
        res.status(404).json({ message: 'Event not found.' });
    }
});

// GET /api/services - List available services
app.get('/api/services', (req, res) => {
    const serviceList = Object.keys(services).map(id => ({ id, name: services[id].name }));
    res.json(serviceList);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('To stop the server, press Ctrl+C');
});
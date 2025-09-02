const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const port = 3000;

// In-memory data store and helpers (copied from original server.js)
let nextEventId = 1;
const services = {
    'serviceA': { name: 'Service A', events: [] },
    'serviceB': { name: 'Service B', events: [] }
};
const generateId = () => nextEventId++;
const checkConflict = (newEvent) => {
    const newEventStart = new Date(newEvent.start);
    const newEventEnd = new Date(newEvent.end);
    let allEventsWithServiceId = [];
    for (const serviceId in services) {
        const serviceEvents = services[serviceId].events.map(event => ({ ...event, serviceId }));
        allEventsWithServiceId = allEventsWithServiceId.concat(serviceEvents);
    }
    const conflicts = allEventsWithServiceId
        .filter(existingEvent => {
            const existingEventStart = new Date(existingEvent.start);
            const existingEventEnd = new Date(existingEvent.end);
            return (newEventStart < existingEventEnd && newEventEnd > existingEventStart) && (newEvent.id !== existingEvent.id);
        })
        .map(conflictingEvent => ({
            type: 'time_overlap',
            proposedEvent: newEvent,
            conflictingEvent: conflictingEvent
        }));
    return conflicts;
};

// Helper function to parse request body
function getBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                if (body === '') {
                    resolve({});
                    return;
                }
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', err => reject(err));
    });
}

// Main server logic
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    // API Routes
    if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');

        if (pathname === '/api/events' && method === 'GET') {
            let allEvents = [];
            for (const serviceId in services) {
                allEvents = allEvents.concat(services[serviceId].events.map(event => ({ ...event, serviceId })));
            }
            res.writeHead(200);
            res.end(JSON.stringify(allEvents));

        } else if (pathname === '/api/events/propose' && method === 'POST') {
            try {
                const body = await getBody(req);
                const proposedEvent = { ...body, id: body.id || generateId() };
                const conflicts = checkConflict(proposedEvent);
                if (conflicts.length > 0) {
                    res.writeHead(409);
                    res.end(JSON.stringify({ message: 'Proposed event conflicts with existing events.', proposedEvent, conflicts }));
                } else {
                    res.writeHead(200);
                    res.end(JSON.stringify({ message: 'No conflicts detected.', proposedEvent }));
                }
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid JSON in request body.' }));
            }

        } else if (pathname === '/api/events' && method === 'POST') {
            try {
                const { serviceId, ...newEvent } = await getBody(req);
                if (!serviceId || !services[serviceId]) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ message: 'Invalid serviceId provided.' }));
                }
                const eventToAdd = { ...newEvent, id: generateId() };
                services[serviceId].events.push(eventToAdd);
                res.writeHead(201);
                res.end(JSON.stringify(eventToAdd));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ message: 'Invalid JSON in request body.' }));
            }

        } else if (pathname.startsWith('/api/events/') && (method === 'PUT' || method === 'DELETE')) {
            const idMatch = pathname.match(/\/api\/events\/(\d+)/);
            if (!idMatch) {
                res.writeHead(404);
                return res.end(JSON.stringify({ message: 'Event not found.' }));
            }
            const eventId = parseInt(idMatch[1]);
            let found = false;
            let serviceIdFound = null;

            for (const serviceId in services) {
                const index = services[serviceId].events.findIndex(e => e.id === eventId);
                if (index !== -1) {
                    found = true;
                    serviceIdFound = serviceId;
                    break;
                }
            }

            if (!found) {
                res.writeHead(404);
                return res.end(JSON.stringify({ message: 'Event not found.' }));
            }

            if (method === 'PUT') {
                try {
                    const updatedEventData = await getBody(req);
                    const index = services[serviceIdFound].events.findIndex(e => e.id === eventId);
                    services[serviceIdFound].events[index] = { ...services[serviceIdFound].events[index], ...updatedEventData, id: eventId };
                    res.writeHead(200);
                    res.end(JSON.stringify(services[serviceIdFound].events[index]));
                } catch (error) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ message: 'Invalid JSON in request body.' }));
                }
            } else { // DELETE
                services[serviceIdFound].events = services[serviceIdFound].events.filter(e => e.id !== eventId);
                res.writeHead(204);
                res.end();
            }

        } else if (pathname === '/api/services' && method === 'GET') {
            const serviceList = Object.keys(services).map(id => ({ id, name: services[id].name }));
            res.writeHead(200);
            res.end(JSON.stringify(serviceList));

        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'API endpoint not found.' }));
        }

    // Static File Server
    } else {
        const safePath = pathname === '/' ? 'index.html' : pathname.substring(1);
        const fullPath = path.join(__dirname, safePath);
        const extname = String(path.extname(fullPath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
        };
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(fullPath, (error, content) => {
            if (error) {
                if (error.code == 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('404: File Not Found');
                } else {
                    res.writeHead(500);
                    res.end('Server Error: ' + error.code);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

// Start the server
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('To stop the server, press Ctrl+C');
});
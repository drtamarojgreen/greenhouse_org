document.addEventListener('DOMContentLoaded', fetchEvents);

async function fetchEvents() {
    const response = await fetch('/api/events');
    const events = await response.json();
    const ul = document.getElementById('events'); // Changed from 'appointments'
    ul.innerHTML = ''; // Clear existing list

    if (events.length === 0) {
        ul.innerHTML = '<li>No events scheduled.</li>';
        return;
    }

    events.forEach(event => {
        const li = document.createElement('li');
        li.className = 'event-item'; // Changed from 'appointment-item'
        li.innerHTML = `
            <strong>${event.title}</strong><br>
            Date: ${event.date} at ${event.time}<br>
            Platform: ${event.platform} (Service: ${event.serviceId || 'N/A'})
        `;
        ul.appendChild(li);
    });
}

async function proposeAndAddEvent() { // Renamed from addAppointment
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const platform = document.getElementById('platform').value;
    const serviceId = 'serviceA'; // Hardcoded for now, could be a dropdown in future

    if (!title || !date || !time || !platform) {
        alert('Please fill in all fields.');
        return;
    }

    // Combine date and time for easier conflict checking in backend
    const startDateTime = new Date(`${date}T${time}:00`);
    // For simplicity, let's assume all events are 1 hour long for now
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const proposedEvent = {
        title,
        date,
        time,
        platform,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        serviceId // Include serviceId in the proposed event
    };

    // Step 1: Propose the event to check for conflicts
    const proposeResponse = await fetch('/api/events/propose', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(proposedEvent)
    });

    if (proposeResponse.status === 409) { // Conflict detected
        const conflictData = await proposeResponse.json();
        let conflictMessage = 'Conflict detected!\n\nProposed Event:\n';
        conflictMessage += `Title: ${conflictData.proposedEvent.title}, Date: ${conflictData.proposedEvent.date}, Time: ${conflictData.proposedEvent.time}\n\n`;
        conflictMessage += 'Conflicting Events:\n';
        conflictData.conflicts.forEach(conflict => {
            conflictMessage += `- ${conflict.conflictingEvent.title} on ${conflict.conflictingEvent.date} at ${conflict.conflictingEvent.time} (Service: ${conflict.conflictingEvent.serviceId || 'N/A'})\n`;
        });
        alert(conflictMessage);
        // In a real app, you'd show a more interactive UI for conflict resolution
        return;
    } else if (!proposeResponse.ok) {
        alert('Failed to propose event for conflict check.');
        return;
    }

    // Step 2: If no conflicts, add the event
    const addResponse = await fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(proposedEvent) // Send the same proposed event data
    });

    if (addResponse.ok) {
        document.getElementById('title').value = '';
        document.getElementById('date').value = '';
        document.getElementById('time').value = '';
        document.getElementById('platform').value = '';
        fetchEvents(); // Refresh the list
    } else {
        alert('Failed to add event after conflict check.');
    }
}
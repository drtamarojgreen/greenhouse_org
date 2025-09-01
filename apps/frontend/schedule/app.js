document.addEventListener('DOMContentLoaded', () => {
    fetchEvents();
    fetchServices();
    resetForm();
    setupModal(); // Set up modal event listeners
});

function setupModal() {
    const modal = document.getElementById('conflict-modal');
    const closeButton = document.querySelector('.close-button');

    closeButton.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

function showConflictModal(conflictData) {
    const modal = document.getElementById('conflict-modal');
    const conflictDetailsDiv = document.getElementById('conflict-details');
    conflictDetailsDiv.innerHTML = ''; // Clear previous conflicts

    let conflictHtml = '<ul>';
    conflictData.conflicts.forEach(conflict => {
        const conflictingEvent = conflict.conflictingEvent;
        conflictHtml += `<li><strong>${conflictingEvent.title}</strong> on ${conflictingEvent.date} at ${conflictingEvent.time} (Service: ${conflictingEvent.serviceId || 'N/A'})</li>`;
    });
    conflictHtml += '</ul>';

    conflictDetailsDiv.innerHTML = conflictHtml;
    modal.style.display = 'block';
}

async function fetchServices() {
    const response = await fetch('/api/services');
    const services = await response.json();
    const select = document.getElementById('service');
    select.innerHTML = '';

    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = service.name;
        select.appendChild(option);
    });
}

async function fetchEvents() {
    const response = await fetch('/api/events');
    const events = await response.json();
    const ul = document.getElementById('events');
    ul.innerHTML = '';

    if (events.length === 0) {
        ul.innerHTML = '<li>No events scheduled.</li>';
        return;
    }

    events.forEach(event => {
        const li = document.createElement('li');
        li.className = 'event-item';
        const eventJsonString = JSON.stringify(event).replace(/'/g, "&apos;");
        li.innerHTML = `
            <strong>${event.title}</strong><br>
            Date: ${event.date} at ${event.time}<br>
            Meeting Platform: ${event.platform} (Service: ${event.serviceId || 'N/A'})
            <div style="margin-top: 5px;">
                <button onclick='editEvent(${eventJsonString})'>Edit</button>
                <button onclick='deleteEvent(${event.id})'>Delete</button>
            </div>
        `;
        ul.appendChild(li);
    });
}

function clearFormInputs() {
    document.getElementById('title').value = '';
    document.getElementById('date').value = '';
    document.getElementById('time').value = '';
    document.getElementById('platform').value = '';
    if (document.getElementById('service').options.length > 0) {
        document.getElementById('service').selectedIndex = 0;
    }
}

function resetForm() {
    clearFormInputs();
    const form = document.getElementById('event-form');
    let button = form.querySelector('button');
    button.textContent = 'Add Event';
    button.onclick = proposeAndAddEvent;

    const existingCancelButton = document.getElementById('cancel-edit-btn');
    if (existingCancelButton) {
        existingCancelButton.remove();
    }
}

function editEvent(event) {
    document.getElementById('title').value = event.title;
    document.getElementById('date').value = event.date;
    document.getElementById('time').value = event.time;
    document.getElementById('platform').value = event.platform;
    document.getElementById('service').value = event.serviceId;

    const form = document.getElementById('event-form');
    let button = form.querySelector('button');
    button.textContent = 'Update Event';
    button.onclick = () => updateEvent(event.id);

    if (!document.getElementById('cancel-edit-btn')) {
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.id = 'cancel-edit-btn';
        cancelButton.type = 'button';
        cancelButton.onclick = resetForm;
        button.parentNode.insertBefore(cancelButton, button.nextSibling);
    }
    form.scrollIntoView({ behavior: 'smooth' });
}

async function updateEvent(eventId) {
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const platform = document.getElementById('platform').value;
    const serviceId = document.getElementById('service').value;

    if (!title || !date || !time || !platform || !serviceId) {
        alert('Please fill in all fields.');
        return;
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const updatedEvent = {
        id: eventId,
        title,
        date,
        time,
        platform: platform,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        serviceId
    };

    const proposeResponse = await fetch('/api/events/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent)
    });

    if (proposeResponse.status === 409) {
        const conflictData = await proposeResponse.json();
        showConflictModal(conflictData);
        return;
    } else if (!proposeResponse.ok) {
        alert('Failed to propose event update for conflict check.');
        return;
    }

    const updateResponse = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent)
    });

    if (updateResponse.ok) {
        resetForm();
        fetchEvents();
    } else {
        alert('Failed to update event.');
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        fetchEvents();
    } else {
        alert('Failed to delete event.');
    }
}

async function proposeAndAddEvent() {
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const platform = document.getElementById('platform').value;
    const serviceId = document.getElementById('service').value;

    if (!title || !date || !time || !platform || !serviceId) {
        alert('Please fill in all fields.');
        return;
    }

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    const proposedEvent = {
        title,
        date,
        time,
        platform: platform,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        serviceId
    };

    const proposeResponse = await fetch('/api/events/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposedEvent)
    });

    if (proposeResponse.status === 409) {
        const conflictData = await proposeResponse.json();
        showConflictModal(conflictData);
        return;
    } else if (!proposeResponse.ok) {
        alert('Failed to propose event for conflict check.');
        return;
    }

    const addResponse = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposedEvent)
    });

    if (addResponse.ok) {
        clearFormInputs();
        fetchEvents();
    } else {
        alert('Failed to add event after conflict check.');
    }
}
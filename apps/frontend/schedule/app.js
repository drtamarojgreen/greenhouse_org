document.addEventListener('DOMContentLoaded', fetchAppointments);

async function fetchAppointments() {
    const response = await fetch('/api/appointments');
    const appointments = await response.json();
    const ul = document.getElementById('appointments');
    ul.innerHTML = ''; // Clear existing list

    if (appointments.length === 0) {
        ul.innerHTML = '<li>No appointments scheduled.</li>';
        return;
    }

    appointments.forEach(app => {
        const li = document.createElement('li');
        li.className = 'appointment-item';
        li.innerHTML = `
            <strong>${app.title}</strong><br>
            Date: ${app.date} at ${app.time}<br>
            Platform: ${app.platform}
        `;
        ul.appendChild(li);
    });
}

async function addAppointment() {
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const platform = document.getElementById('platform').value;

    if (!title || !date || !time || !platform) {
        alert('Please fill in all fields.');
        return;
    }

    const newAppointment = { title, date, time, platform };

    const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAppointment)
    });

    if (response.ok) {
        document.getElementById('title').value = '';
        document.getElementById('date').value = '';
        document.getElementById('time').value = '';
        document.getElementById('platform').value = '';
        fetchAppointments(); // Refresh the list
    } else {
        alert('Failed to add appointment.');
    }
}

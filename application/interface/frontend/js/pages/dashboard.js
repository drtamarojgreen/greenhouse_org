const dashboardPage = `
    <div>
        <h2>Patient Dashboard</h2>
        <div id="dashboard-content"></div>
    </div>
`;

const fetchPatientData = async () => {
    // In a real application, you would get the patient ID from the logged-in user
    const patientId = 1;
    const response = await fetch(`http://localhost:5000/api/patients/${patientId}`);
    const patient = await response.json();

    const content = `
        <div class="primary-records">
            <h3>Primary Records</h3>
            <p>Patient ID: ${patient.id}</p>
            <p>Name: (Name not in patient model)</p>
            <p>DOB: ${patient.date_of_birth}</p>
        </div>
        <div class="linked-tables">
            <h3>Linked Tables</h3>
            <ul>
                <li>patients.id equals ${patient.id}</li>
                <li>users.id equals ${patient.user_id}</li>
                <li>vitals.patient_id equals ${patient.id}</li>
                <li>therapy_sessions.appointment_id references appointments.id</li>
            </ul>
        </div>
        <div class="summary-widgets">
            <h3>Summary Widgets</h3>
            <p>Symptoms Last 7 Days</p>
            <p>Mood: 3.8</p>
            <p>Sleep: 6.2 hours</p>
            <p>Anxiety: 2.1</p>
        </div>
        <div class="medication-adherence">
            <h3>Medication Adherence</h3>
            <p>Buprenorphine 8 mg adherence 92 percent</p>
            <p>Last taken: 08:00</p>
            <p>Next refill: 2026-01-01</p>
        </div>
        <div class="upcoming-appointments">
            <h3>Upcoming Appointments</h3>
            <p>CBT 2025-12-25 10:00</p>
            <p>Telehealth link available</p>
        </div>
        <div class="actions">
            <h3>Actions</h3>
            <button>Add Symptom</button>
            <button>Add Medication</button>
            <button>Edit Patient Record</button>
            <button>View Model</button>
        </div>
    `;

    document.getElementById('dashboard-content').innerHTML = content;

};

// This is a bit of a hack for the router to work with async content
setTimeout(fetchPatientData, 0);


export default dashboardPage;

const patientRecordPage = `
    <div>
        <h2>Edit Patient Record</h2>
        <div id="patient-record-content"></div>
    </div>
`;

const fetchPatientRecord = async () => {
    // In a real application, you would get the patient ID from the logged-in user
    const patientId = 1;
    const response = await fetch(`http://localhost:5000/api/patients/${patientId}`);
    const patient = await response.json();

    const content = `
        <form>
            <label for="patient_id">patient_id</label>
            <input type="text" id="patient_id" name="patient_id" value="${patient.id}" readonly>
            <br>
            <label for="email">users.email</label>
            <input type="email" id="email" name="email" value="(Email not in patient model)">
            <br>
            <label for="first_name">first_name</label>
            <input type="text" id="first_name" name="first_name" value="(First name not in patient model)">
            <br>
            <label for="last_name">last_name</label>
            <input type="text" id="last_name" name="last_name" value="(Last name not in patient model)">
            <br>
            <label for="gender">gender</label>
            <input type="text" id="gender" name="gender" value="${patient.gender}">
            <br>
            <label for="address">address</label>
            <input type="text" id="address" name="address" value="${patient.address_line_1}">
            <br>
            <label for="phone">phone</label>
            <input type="text" id="phone" name="phone" value="(Phone not in patient model)">
            <br>
            <label for="created_at">created_at</label>
            <input type="text" id="created_at" name="created_at" value="${patient.created_at}" readonly>
            <br>
            <button type="submit">Save Changes</button>
        </form>
        <div class="related-data-tabs">
            <h3>Related Data Tabs</h3>
            <button>Vitals</button>
            <button>Therapy Sessions</button>
            <button>Homework</button>
            <button>Messages</button>
            <button>Imaging</button>
        </div>
    `;

    document.getElementById('patient-record-content').innerHTML = content;
};

// This is a bit of a hack for the router to work with async content
setTimeout(fetchPatientRecord, 0);

export default patientRecordPage;

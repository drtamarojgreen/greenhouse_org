// No IIFE wrapper here anymore. This file will be loaded by greenhouse.js.

    // Function to build the patient appointment request form UI
    function buildPatientFormUI() {
        const fragment = document.createDocumentFragment();

        // First Panel (Scheduling App)
        const panel1 = document.createElement('div');
        panel1.className = 'wixui-column-strip__column';

        const h1 = document.createElement('h1');
        h1.textContent = 'Request an Appointment';
        panel1.appendChild(h1);

        const appointmentFormDiv = document.createElement('div');
        appointmentFormDiv.id = 'appointment-form';
        panel1.appendChild(appointmentFormDiv);

        const h2 = document.createElement('h2');
        h2.textContent = 'Appointment Details';
        appointmentFormDiv.appendChild(h2);

        // Form elements
        const labels = ['Title', 'Date', 'Time', 'Meeting Platform', 'Service'];
        const ids = ['title', 'date', 'time', 'platform', 'service'];
        const types = ['text', 'date', 'time', 'text', 'select'];
        const placeholders = ['', '', '', 'e.g., Google Meet, Zoom', ''];

        for (let i = 0; i < labels.length; i++) {
            const label = document.createElement('label');
            label.htmlFor = ids[i];
            label.textContent = labels[i] + ':';
            appointmentFormDiv.appendChild(label);
            appointmentFormDiv.appendChild(document.createElement('br'));

            if (types[i] === 'select') {
                const select = document.createElement('select');
                select.id = ids[i];
                select.name = ids[i];
                select.required = true;
                appointmentFormDiv.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = types[i];
                input.id = ids[i];
                input.name = ids[i];
                input.required = true;
                if (placeholders[i]) {
                    input.placeholder = placeholders[i];
                }
                appointmentFormDiv.appendChild(input);
            }
            appointmentFormDiv.appendChild(document.createElement('br'));
            appointmentFormDiv.appendChild(document.createElement('br'));
        }

        const button = document.createElement('button');
        button.textContent = 'Request Appointment';
        button.onclick = AppointmentApp.proposeAndAddAppointment; // This function is in app.js
        appointmentFormDiv.appendChild(button);

        // Hidden appointment list (for app.js to potentially use, but not displayed)
        const appointmentListDiv = document.createElement('div');
        appointmentListDiv.id = 'appointment-list';
        appointmentListDiv.style.display = 'none';
        panel1.appendChild(appointmentListDiv);

        const appointmentListH2 = document.createElement('h2');
        appointmentListH2.textContent = 'Your Appointments';
        appointmentListDiv.appendChild(appointmentListH2);

        const appointmentListUl = document.createElement('ul');
        appointmentListUl.id = 'appointments';
        appointmentListDiv.appendChild(appointmentListUl);

        // Hidden conflict modal
        const conflictModalDiv = document.createElement('div');
        conflictModalDiv.id = 'conflict-modal';
        conflictModalDiv.className = 'modal';
        conflictModalDiv.style.display = 'none';
        panel1.appendChild(conflictModalDiv);

        const modalContentDiv = document.createElement('div');
        modalContentDiv.className = 'modal-content';
        conflictModalDiv.appendChild(modalContentDiv);

        const closeButtonSpan = document.createElement('span');
        closeButtonSpan.className = 'close-button';
        closeButtonSpan.innerHTML = '&times;';
        modalContentDiv.appendChild(closeButtonSpan);

        const conflictH2 = document.createElement('h2');
        conflictH2.textContent = 'Scheduling Conflict Detected';
        modalContentDiv.appendChild(conflictH2);

        const conflictP = document.createElement('p');
        conflictP.textContent = 'The proposed appointment overlaps with the following existing appointment(s):';
        modalContentDiv.appendChild(conflictP);

        const conflictDetailsDiv = document.createElement('div');
        conflictDetailsDiv.id = 'conflict-details';
        modalContentDiv.appendChild(conflictDetailsDiv);

        fragment.appendChild(panel1); // Add first panel to fragment

        // Second Panel (Instruction Text)
        const panel2 = document.createElement('div');
        panel2.className = 'wixui-column-strip__column';

        const instructionsH2 = document.createElement('h2');
        instructionsH2.textContent = 'How to Use the Calendar';
        panel2.appendChild(instructionsH2);

        const instructionsP1 = document.createElement('p');
        instructionsP1.textContent = 'To request an appointment, please fill out the form on the left. Provide your preferred title, date, time, meeting platform, and the service you require.';
        panel2.appendChild(instructionsP1);

        const instructionsP2 = document.createElement('p');
        instructionsP2.textContent = 'Our team will review your request and confirm the appointment. You will receive a notification once your appointment is scheduled.';
        panel2.appendChild(instructionsP2);

        const instructionsP3 = document.createElement('p');
        instructionsP3.textContent = 'Please ensure all fields are accurately completed to avoid delays in scheduling. If you have any questions, feel free to contact us.';
        panel2.appendChild(instructionsP3);

        fragment.appendChild(panel2); // Add second panel to fragment

        return fragment; // Return the fragment containing both panels
    }

    // Function to load and execute the Dashboard UI script
    async function buildDashboardUI() {
        const response = await fetch(`${githubPagesBaseUrl}js/dashboard.js`); // Updated path
        if (!response.ok) throw new Error(`Failed to load dashboard.js: ${response.statusText}`);
        const scriptText = await response.text();

        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptText;
        document.body.appendChild(scriptElement);

        // Assuming buildDashboardUI function is now globally available from dashboard.js
        // This will return the fragment created by the function in dashboard.js
        return window.buildDashboardUI();
    }

    // Function to load and execute the Admin UI script
    async function buildAdminUI() {
        const response = await fetch(`${githubPagesBaseUrl}js/admin.js`); // Updated path
        if (!response.ok) throw new Error(`Failed to load admin.js: ${response.statusText}`);
        const scriptText = await response.text();

        const scriptElement = document.createElement('script');
        scriptElement.textContent = scriptText;
        document.body.appendChild(scriptElement);

        // Assuming buildAdminUI function is now globally available from admin.js
        // This will return the fragment created by the function in admin.js
        return window.buildAdminUI();
    }

    // Central function to render the appropriate view
    async function renderView(viewType) { // Made async
        switch (viewType) {
            case 'dashboard':
                return await buildDashboardUI(); // Await the async function
            case 'admin':
                return await buildAdminUI(); // Await the async function
            case 'patient':
            default:
                return buildPatientFormUI();
        }
    }

    window.loadScheduleApp = async function(targetSelector, githubPagesBaseUrl) { // Exposed globally
        try {
            const appJsResponse = await fetch(`${githubPagesBaseUrl}js/app.js`); // Updated path
            if (!appJsResponse.ok) throw new Error(`Failed to load app.js: ${appJsResponse.statusText}`);
            const appJsText = await appJsResponse.text();

            const scriptElement = document.createElement('script');
            scriptElement.textContent = appJsText;
            document.body.appendChild(scriptElement);

            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get('view');

            let appDomFragment = await renderView(view); // Await renderView

            const cssResponse = await fetch(`${githubPagesBaseUrl}css/schedule.css`); // Updated path
            if (!cssResponse.ok) throw new Error(`Failed to load CSS: ${cssResponse.statusText}`);
            const cssText = await cssResponse.text();

            const targetElement = document.querySelector(targetSelector);
            if (targetElement) {
                targetElement.innerHTML = '';
                targetElement.appendChild(appDomFragment);
            } else {
                console.error('Target element not found:', targetSelector);
                return;
            }

            const styleElement = document.createElement('style');
            styleElement.textContent = cssText;
            document.head.appendChild(styleElement);
            
            // Initialize the app after the DOM is built
            if (window.AppointmentApp && typeof window.AppointmentApp.init === 'function') {
                window.AppointmentApp.init();
            }

            console.log('Schedule app loaded successfully!');

        } catch (error) {
            console.error('Error loading schedule app:', error);
        }
    }; // End of global function definition
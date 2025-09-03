(function() {
    const targetSelector = '#SITE_PAGES_TRANSITION_GROUP > div > div:nth-child(2) > div > div > div:nth-child(1) > section:nth-child(1) > div:nth-child(2) > div > section > div > div.wixui-column-strip__column';
    const githubPagesBaseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/';

    // Function to create the patient appointment request form DOM
    function createPatientFormDom() {
        const fragment = document.createDocumentFragment(); // Use a fragment to append multiple elements efficiently

        // First Panel (Scheduling App)
        const panel1 = document.createElement('div');
        panel1.className = 'wixui-column-strip__column';

        const h1 = document.createElement('h1');
        h1.textContent = 'Request an Appointment';
        panel1.appendChild(h1);

        const eventFormDiv = document.createElement('div');
        eventFormDiv.id = 'event-form';
        panel1.appendChild(eventFormDiv);

        const h2 = document.createElement('h2');
        h2.textContent = 'Appointment Details';
        eventFormDiv.appendChild(h2);

        // Form elements
        const labels = ['Title', 'Date', 'Time', 'Meeting Platform', 'Service'];
        const ids = ['title', 'date', 'time', 'platform', 'service'];
        const types = ['text', 'date', 'time', 'text', 'select'];
        const placeholders = ['', '', '', 'e.g., Google Meet, Zoom', ''];

        for (let i = 0; i < labels.length; i++) {
            const label = document.createElement('label');
            label.htmlFor = ids[i];
            label.textContent = labels[i] + ':';
            eventFormDiv.appendChild(label);
            eventFormDiv.appendChild(document.createElement('br'));

            if (types[i] === 'select') {
                const select = document.createElement('select');
                select.id = ids[i];
                select.name = ids[i];
                select.required = true;
                eventFormDiv.appendChild(select);
            } else {
                const input = document.createElement('input');
                input.type = types[i];
                input.id = ids[i];
                input.name = ids[i];
                input.required = true;
                if (placeholders[i]) {
                    input.placeholder = placeholders[i];
                }
                eventFormDiv.appendChild(input);
            }
            eventFormDiv.appendChild(document.createElement('br'));
            eventFormDiv.appendChild(document.createElement('br'));
        }

        const button = document.createElement('button');
        button.textContent = 'Add Event';
        button.onclick = proposeAndAddEvent; // This function is in app.js
        eventFormDiv.appendChild(button);

        // Hidden event list (for app.js to potentially use, but not displayed)
        const eventListDiv = document.createElement('div');
        eventListDiv.id = 'event-list';
        eventListDiv.style.display = 'none';
        panel1.appendChild(eventListDiv);

        const eventListH2 = document.createElement('h2');
        eventListH2.textContent = 'Your Events';
        eventListDiv.appendChild(eventListH2);

        const eventListUl = document.createElement('ul');
        eventListUl.id = 'events';
        eventListDiv.appendChild(eventListUl);

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
        conflictP.textContent = 'The proposed event overlaps with the following existing event(s):';
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

    async function loadScheduleApp() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get('view');

            let appDomFragment;
            if (view === 'dashboard') {
                console.log('Dashboard view requested. Not yet implemented.');
                return;
            } else if (view === 'admin') {
                console.log('Admin view requested. Not yet implemented.');
                return;
            } else {
                appDomFragment = createPatientFormDom(); // Default to patient form
            }

            const cssResponse = await fetch(`${githubPagesBaseUrl}apps/frontend/schedule/schedule.css`);
            if (!cssResponse.ok) throw new Error(`Failed to load CSS: ${cssResponse.statusText}`);
            const cssText = await cssResponse.text();

            const appJsResponse = await fetch(`${githubPagesBaseUrl}apps/frontend/schedule/app.js`);
            if (!appJsResponse.ok) throw new Error(`Failed to load app.js: ${appJsResponse.statusText}`);
            const appJsText = await appJsResponse.text();

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

            const scriptElement = document.createElement('script');
            scriptElement.textContent = appJsText;
            document.body.appendChild(scriptElement);

            console.log('Schedule app loaded successfully!');

        } catch (error) {
            console.error('Error loading schedule app:', error);
        }
    }

    loadScheduleApp();
})();
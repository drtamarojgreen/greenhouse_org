
(function() {
    /**
     * @namespace Scheduler
     * @description Manages the loading and rendering of different scheduling views (Patient, Dashboard, Admin).
     */
    const Scheduler = {
        // Base URL for fetching resources, to be set on initialization
        githubPagesBaseUrl: '',

        /**
         * Builds the UI for the patient-facing appointment request form.
         * @returns {DocumentFragment} A DocumentFragment containing the form UI.
         */
        buildPatientFormUI() {
            const fragment = document.createDocumentFragment();

            // Main container for the two-panel layout
            const layoutContainer = document.createElement('div');
            layoutContainer.className = 'wixui-layout-container'; // A class for styling the layout

            // Panel 1: Scheduling Form
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

            const form = this.createFormFields();
            appointmentFormDiv.appendChild(form);

            // Hidden elements for conflict resolution and appointment lists
            panel1.appendChild(this.createHiddenElements());

            layoutContainer.appendChild(panel1);

            // Panel 2: Instructional Text
            const panel2 = document.createElement('div');
            panel2.className = 'wixui-column-strip__column';
            panel2.appendChild(this.createInstructionsPanel());
            layoutContainer.appendChild(panel2);

            fragment.appendChild(layoutContainer);

            return fragment;
        },

        /**
         * Creates the form fields for the patient appointment request.
         * @returns {HTMLFormElement} The generated form element.
         */
        createFormFields() {
            const form = document.createElement('form');
            form.id = 'patient-appointment-form';

            const fields = [
                { label: 'Title', id: 'title', type: 'text', placeholder: 'e.g., Initial Consultation' },
                { label: 'Date', id: 'date', type: 'date', placeholder: '' },
                { label: 'Time', id: 'time', type: 'time', placeholder: '' },
                { label: 'Meeting Platform', id: 'platform', type: 'text', placeholder: 'e.g., Google Meet, Zoom' },
                { label: 'Service', id: 'service', type: 'select', placeholder: '' }
            ];

            fields.forEach(field => {
                const label = document.createElement('label');
                label.htmlFor = field.id;
                label.textContent = field.label + ':';
                form.appendChild(label);
                form.appendChild(document.createElement('br'));

                let input;
                if (field.type === 'select') {
                    input = document.createElement('select');
                    // Options for select will be populated dynamically
                } else {
                    input = document.createElement('input');
                    input.type = field.type;
                    if (field.placeholder) {
                        input.placeholder = field.placeholder;
                    }
                }
                input.id = field.id;
                input.name = field.id;
                input.required = true;
                form.appendChild(input);
                form.appendChild(document.createElement('br'));
                form.appendChild(document.createElement('br'));
            });

            const button = document.createElement('button');
            button.type = 'submit'; // Use submit type for form
            button.textContent = 'Request Appointment';
            button.id = 'propose-appointment-btn';
            form.appendChild(button);

            return form;
        },

        /**
         * Creates hidden elements used by the application (e.g., conflict modal).
         * @returns {DocumentFragment}
         */
        createHiddenElements() {
            const fragment = document.createDocumentFragment();

            const appointmentListDiv = document.createElement('div');
            appointmentListDiv.id = 'appointment-list';
            appointmentListDiv.style.display = 'none';
            fragment.appendChild(appointmentListDiv);

            const conflictModalDiv = document.createElement('div');
            conflictModalDiv.id = 'conflict-modal';
            conflictModalDiv.className = 'modal';
            conflictModalDiv.style.display = 'none';

            const modalContent = `
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2>Scheduling Conflict Detected</h2>
                    <p>The proposed appointment overlaps with the following existing appointment(s):</p>
                    <div id="conflict-details"></div>
                </div>
            `;
            conflictModalDiv.innerHTML = modalContent;
            fragment.appendChild(conflictModalDiv);

            return fragment;
        },

        /**
         * Creates the instructional panel content.
         * @returns {DocumentFragment}
         */
        createInstructionsPanel() {
            const fragment = document.createDocumentFragment();
            const h2 = document.createElement('h2');
            h2.textContent = 'How to Use the Calendar';
            fragment.appendChild(h2);

            const paragraphs = [
                'To request an appointment, please fill out the form on the left. Provide your preferred title, date, time, meeting platform, and the service you require.',
                'Our team will review your request and confirm the appointment. You will receive a notification once your appointment is scheduled.',
                'Please ensure all fields are accurately completed to avoid delays in scheduling. If you have any questions, feel free to contact us.'
            ];

            paragraphs.forEach(text => {
                const p = document.createElement('p');
                p.textContent = text;
                fragment.appendChild(p);
            });

            return fragment;
        },

        /**
         * Dynamically loads a script and appends it to the body.
         * @param {string} scriptName - The name of the script file (e.g., 'dashboard.js').
         * @returns {Promise<void>}
         */
        async loadScript(scriptName) {
            const response = await fetch(`${this.githubPagesBaseUrl}js/${scriptName}`);
            if (!response.ok) throw new Error(`Failed to load ${scriptName}: ${response.statusText}`);
            const scriptText = await response.text();

            // Avoid re-adding the script if it already exists
            if (document.querySelector(`script[data-script-name="${scriptName}"]`)) {
                return;
            }

            const scriptElement = document.createElement('script');
            scriptElement.dataset.scriptName = scriptName;
            scriptElement.textContent = scriptText;
            document.body.appendChild(scriptElement);
        },

        /**
         * Renders the appropriate view (Patient, Dashboard, or Admin) based on URL parameters.
         * @returns {Promise<DocumentFragment>} A promise that resolves with the DOM fragment for the view.
         */
        async renderView() {
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get('view');

            switch (view) {
                case 'dashboard':
                    await this.loadScript('dashboard.js');
                    if (window.Dashboard && typeof window.Dashboard.init === 'function') {
                        return await window.Dashboard.init();
                    }
                    break;
                case 'admin':
                    await this.loadScript('admin.js');
                    if (window.Admin && typeof window.Admin.init === 'function') {
                        return await window.Admin.init();
                    }
                    break;
                case 'patient':
                default:
                    return this.buildPatientFormUI();
            }
            // Return an empty fragment or an error message if the view fails to load
            const errorFragment = document.createDocumentFragment();
            const p = document.createElement('p');
            p.textContent = 'Error: View could not be loaded.';
            p.style.color = 'red';
            errorFragment.appendChild(p);
            return errorFragment;
        },

        /**
         * Initializes the entire scheduling application.
         * @param {string} targetSelector - The CSS selector for the element to load the app into.
         * @param {string} githubPagesBaseUrl - The base URL for fetching assets.
         */
        async init(targetSelector, githubPagesBaseUrl) {
            this.githubPagesBaseUrl = githubPagesBaseUrl;
            const targetElement = document.querySelector(targetSelector);

            if (!targetElement) {
                console.error('Target element not found:', targetSelector);
                return;
            }

            try {
                // Load main application logic
                await this.loadScript('app.js');

                // Render the correct view
                const appDomFragment = await this.renderView();

                // Load CSS
                const cssResponse = await fetch(`${this.githubPagesBaseUrl}css/schedule.css`);
                if (!cssResponse.ok) throw new Error(`Failed to load CSS: ${cssResponse.statusText}`);
                const cssText = await cssResponse.text();

                // Clear target and append new content
                targetElement.innerHTML = '';
                targetElement.appendChild(appDomFragment);

                // Append styles to the head
                const styleElement = document.createElement('style');
                styleElement.textContent = cssText;
                document.head.appendChild(styleElement);

                // Initialize the main app logic after the DOM is built
                if (window.AppointmentApp && typeof window.AppointmentApp.init === 'function') {
                    window.AppointmentApp.init();
                }

                console.log('Schedule app loaded successfully!');

            } catch (error) {
                console.error('Error loading schedule app:', error);
                targetElement.innerHTML = `<p style="color: red;">Failed to load the scheduling application. Please check the console for details.</p>`;
            }
        }
    };

    // Expose the init function to the global scope, namespaced under Greenhouse
    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.loadScheduleApp = Scheduler.init.bind(Scheduler);

})();

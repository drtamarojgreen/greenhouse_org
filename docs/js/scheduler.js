/**
 * @file scheduler.js
 * @description This script contains the core functionality for the Greenhouse appointment scheduling application.
 * It is responsible for rendering the various scheduling views (patient, dashboard, admin) and handling
 * user interactions within those views.
 *
 * @integration This script is not loaded directly by the host page. Instead, it is loaded by `greenhouse.js`
 * when the scheduling application is needed. `greenhouse.js` passes the target selector for rendering
 * via a `data-target-selector` attribute on the script tag. This design allows the scheduler to be
 * a self-contained module that can be easily dropped into any page without requiring manual
 * configuration or initialization.
 *
 * @design The script is designed to be completely anonymous and self-contained. It uses an Immediately
 * Invoked Function Expression (IIFE) to avoid polluting the global namespace. It also uses a
 * data-driven approach to receive information from the loader script, further decoupling the application
 * from the loader. This design is crucial for preventing conflicts with other scripts on the site,
 * which is known to be sensitive to global namespace pollution.
 */

(function() {
    /**
     * @description The script element that is currently being executed.
     * This is used to retrieve configuration attributes from the loader script.
     * @type {HTMLScriptElement}
     */
    const scriptElement = document.currentScript;

    /**
     * @description The CSS selector for the element where the scheduler app will be rendered.
     * @type {string|null}
     */
    const targetSelector = scriptElement.getAttribute('data-target-selector');

    /**
     * @description The base URL for fetching application assets.
     * @type {string|null}
     */
    const baseUrl = scriptElement.getAttribute('data-base-url');

    // If the target selector or base URL are not found, exit without doing anything.
    if (!targetSelector || !baseUrl) {
        console.error('Scheduler script missing required data attributes (target-selector or base-url).');
        return;
    }

    /**
     * @namespace GreenhouseAppsScheduler
     * @description The main object for the scheduling application.
     */
    const GreenhouseAppsScheduler = {
        /**
         * @description The base URL for fetching resources, to be set on initialization.
         * @type {string}
         */
        baseUrl: '',

        /**
         * @function buildPatientFormUI
         * @description Builds the UI for the patient-facing appointment request form.
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
         * @function createFormFields
         * @description Creates the form fields for the patient appointment request.
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
         * @function createHiddenElements
         * @description Creates hidden elements used by the application (e.g., conflict modal).
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
         * @function createInstructionsPanel
         * @description Creates the instructional panel content.
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
         * @function loadScript
         * @description Dynamically loads a script and appends it to the body.
         * @param {string} scriptName - The name of the script file (e.g., 'dashboard.js').
         * @returns {Promise<void>}
         */
        async loadScript(scriptName) {
            const response = await fetch(`${this.baseUrl}js/${scriptName}`);
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
         * @function renderView
         * @description Renders the appropriate view (Patient, Dashboard, or Admin) based on URL parameters.
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
         * @function displayError
         * @description Displays a visible error message on the page.
         * @param {string} message - The error message to display.
         */
        displayError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'greenhouse-app-error';
            errorDiv.style.color = 'red';
            errorDiv.style.backgroundColor = '#fff0f0';
            errorDiv.style.border = '1px solid red';
            errorDiv.style.padding = '15px';
            errorDiv.style.margin = '20px';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.fontFamily = 'Arial, sans-serif';
            errorDiv.style.zIndex = '10000';
            errorDiv.style.position = 'relative';
            errorDiv.textContent = message;
            document.body.insertAdjacentElement('afterbegin', errorDiv);
        },

        /**
         * @function init
         * @description Initializes the entire scheduling application.
         * @param {string} targetSelector - The CSS selector for the element to load the app into.
         * @param {string} baseUrl - The base URL for fetching assets.
         */
        async init(targetSelector, baseUrl) {
            this.baseUrl = baseUrl;
            const targetElement = document.querySelector(targetSelector);

            if (!targetElement) {
                const errorMessage = `Greenhouse App Error: The target element "${targetSelector}" was not found on the page. The application cannot be loaded.`;
                console.error(errorMessage);
                this.displayError(errorMessage);
                return;
            }

            try {
                // Load main application logic
                await this.loadScript('app.js');

                // Render the correct view
                const appDomFragment = await this.renderView();

                // Load CSS
                const cssResponse = await fetch(`${this.baseUrl}css/schedule.css`);
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
                const errorMessage = 'Failed to load the scheduling application. Please check the console for details or contact support.';
                this.displayError(errorMessage);
                targetElement.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
            }
        }
    };

    // Initialize the scheduler application.
    GreenhouseAppsScheduler.init(targetSelector, baseUrl);
})();
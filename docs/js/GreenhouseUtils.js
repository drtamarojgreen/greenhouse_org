// docs/js/GreenhouseUtils.js

const GreenhouseUtils = (function() {

    /**
     * Displays a non-blocking error message on the page.
     * @param {string} message - The error message to display.
     * @param {string} [type='error'] - The type of message (e.g., 'error', 'success', 'info').
     */
    function displayMessage(message, type = 'error') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `greenhouse-app-message greenhouse-app-message--${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: white;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        `;

        if (type === 'error') {
            messageDiv.style.backgroundColor = '#dc3545'; // Red
        } else if (type === 'success') {
            messageDiv.style.backgroundColor = '#28a745'; // Green
        } else if (type === 'info') {
            messageDiv.style.backgroundColor = '#007bff'; // Blue
        }

        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // Fade in
        setTimeout(() => {
            messageDiv.style.opacity = '1';
        }, 100);

        // Fade out and remove after a few seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.addEventListener('transitionend', () => messageDiv.remove());
        }, 5000);
    }

    return {
        displayError: (message) => displayMessage(message, 'error'),
        displaySuccess: (message) => displayMessage(message, 'success'),
        displayInfo: (message) => displayMessage(message, 'info'),
    };

})();
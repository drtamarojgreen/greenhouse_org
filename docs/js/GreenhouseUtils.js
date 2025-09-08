const GreenhouseUtils = (function() {
    /**
     * Display a non-blocking notification
     * @param {string} message - The message text
     * @param {'error'|'success'|'info'} type - Message type
     * @param {number} duration - How long to show message (ms)
     */
    function displayMessage(message, type = 'error', duration = 5000) {
        console.debug(`[GreenhouseUtils] Showing ${type} message: "${message}"`);

        // Create container
        const notif = document.createElement('div');
        notif.className = `greenhouse-notification greenhouse-notification-${type}`;

        // Message span
        const messageSpan = document.createElement('span');
        messageSpan.className = 'greenhouse-notification-message';
        messageSpan.textContent = message;
        notif.appendChild(messageSpan);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'greenhouse-notification-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => removeNotification(notif);
        notif.appendChild(closeBtn);

        document.body.appendChild(notif);

        // Auto-remove after duration
        setTimeout(() => removeNotification(notif), duration);
    }

    /** Animate and remove notification */
    function removeNotification(notif) {
        notif.style.animation = 'slideOutRight 0.3s ease forwards';
        notif.addEventListener('animationend', () => notif.remove());
    }

    // Public API
    return {
        displayError: (msg, duration) => displayMessage(msg, 'error', duration),
        displaySuccess: (msg, duration) => displayMessage(msg, 'success', duration),
        displayInfo: (msg, duration) => displayMessage(msg, 'info', duration),
    };
})();

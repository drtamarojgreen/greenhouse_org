document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const authPage = document.getElementById('auth-page');
    const meditationPage = document.getElementById('meditation-page');

    // Auth elements
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    const privacyConsent = document.getElementById('privacy-consent');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');

    // Navigation
    const navButtons = document.querySelectorAll('.nav-button');
    const backButtons = document.querySelectorAll('.back-button');

    // Notifications
    const notificationBell = document.getElementById('notification-bell');
    const notificationModal = document.getElementById('notification-modal');
    const closeButton = document.querySelector('.close-button');
    const notificationCount = document.getElementById('notification-count');

    // --- Sub-page specific elements ---
    const addEventButton = document.getElementById('add-event-button');
    const eventList = document.getElementById('event-list');
    const playPauseButton = document.getElementById('play-pause-button');
    const sceneTimer = document.getElementById('scene-timer');
    const historyList = document.getElementById('history-list');

    // --- Authentication ---
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    });
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });
    loginButton.addEventListener('click', () => {
        authPage.style.display = 'none';
        meditationPage.style.display = 'block';
    });
    signupButton.addEventListener('click', () => {
        if (privacyConsent.checked) {
            authPage.style.display = 'none';
            meditationPage.style.display = 'block';
        } else {
            alert('You must agree to the data privacy policy.');
        }
    });

    // --- Page Navigation ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'flex';
            if (targetId === 'history-page') {
                populateHistory();
            }
        });
    });
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.sub-page').style.display = 'none';
        });
    });

    // --- Notifications ---
    notificationBell.addEventListener('click', () => notificationModal.style.display = 'flex');
    closeButton.addEventListener('click', () => notificationModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == notificationModal) notificationModal.style.display = 'none';
    });

    // --- Scheduler ---
    addEventButton.addEventListener('click', () => {
        const type = document.getElementById('event-type').value;
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        if (date && time) {
            const li = document.createElement('li');
            li.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} at ${time} on ${date}`;
            eventList.appendChild(li);
        } else {
            alert('Please select a date and time.');
        }
    });

    // --- Meditation Scene ---
    let timerInterval;
    let playing = false;
    playPauseButton.addEventListener('click', () => {
        playing = !playing;
        playPauseButton.textContent = playing ? 'Pause' : 'Play';
        if (playing) {
            let duration = 15 * 60;
            timerInterval = setInterval(() => {
                duration--;
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                sceneTimer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                if (duration <= 0) {
                    clearInterval(timerInterval);
                    playing = false;
                    playPauseButton.textContent = 'Play';
                }
            }, 1000);
        } else {
            clearInterval(timerInterval);
        }
    });

    // --- History ---
    function populateHistory() {
        historyList.innerHTML = '';
        const mockData = [
            "Yesterday: Pulse Pre-Run 70bpm, Post-Run 130bpm",
            "Yesterday: Breathing Rate Pre-Run 18, Post-Run 30",
            "2 days ago: Mood Score 7/10"
        ];
        mockData.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            historyList.appendChild(li);
        });
    }
});

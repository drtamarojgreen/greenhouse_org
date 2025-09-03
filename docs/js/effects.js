document.addEventListener('DOMContentLoaded', function() {

// Module-level variables to hold state
let canIconElement;
let headingElementForCan;
let pouringIntervalId;

// We define the event handler functions so we can properly add and remove them.
const handleMouseMoveForCan = (e) => {
    if (canIconElement) {
        // Update the icon's position to follow the cursor
        canIconElement.style.left = `${e.clientX}px`;
        canIconElement.style.top = `${e.clientY}px`;
    }
};

const handleHeadingEnterForCan = () => {
    if (headingElementForCan) {
        headingElementForCan.classList.add('blooming');
        startPouringWater(); // Start the particle effect
    }
};

const handleHeadingLeaveForCan = () => {
    if (headingElementForCan) {
        headingElementForCan.classList.remove('blooming');
        stopPouringWater(); // Stop the particle effect
    }
};

// --- Particle System ---

function startPouringWater() {
    if (pouringIntervalId) return; // Already pouring
    pouringIntervalId = setInterval(createWaterDropletParticle, 100);
}

function stopPouringWater() {
    clearInterval(pouringIntervalId);
    pouringIntervalId = null;
}

function createWaterDropletParticle() {
    if (!canIconElement) return;
    const droplet = document.createElement('div');
    droplet.className = 'water-droplet';
    
    const canRect = canIconElement.getBoundingClientRect();
    // Position drops to fall from the "spout" of the can icon
    const startX = canRect.left + 20 + (Math.random() * 10 - 5);
    const startY = canRect.top + 30 + (Math.random() * 10 - 5);
    droplet.style.left = `${startX}px`;
    droplet.style.top = `${startY}px`;

    document.body.appendChild(droplet);

    // Clean up the DOM by removing the droplet after its animation is finished
    setTimeout(() => {
        droplet.remove();
    }, 1000); // This duration must match the 'fall' animation duration in the CSS
}

// --- Activation/Deactivation ---

function activateWateringCanEffect() {
    //headingElementForCan = document.getElementById('effect-heading');
    // Do nothing if the effect is already active or the heading doesn't exist
    headingElementForCans = document.querySelectorAll('body div#SITE_CONTAINER div div#site-root.site-root div#masterPage.mesh-layout.masterPage.css-editing-scope header#SITE_HEADER div section div p span span');
    headingElementForCan = headingElementForCans[0];
    
    if (!headingElementForCan || document.querySelector('.watering-can-icon')) return;

    // Create the icon element
    canIconElement = document.createElement('div');
    canIconElement.className = 'watering-can-icon';
    canIconElement.innerHTML = '🪴'; // Potted Plant emoji as the icon
    document.body.appendChild(canIconElement);

    // Attach all necessary event listeners
    window.addEventListener('mousemove', handleMouseMoveForCan);
    headingElementForCan.addEventListener('mouseenter', handleHeadingEnterForCan);
    headingElementForCan.addEventListener('mouseleave', handleHeadingLeaveForCan);
}

function deactivateWateringCanEffect() {
    // Stop any running animations/intervals
    stopPouringWater();
    
    // Remove the icon from the DOM
    if (canIconElement) {
        canIconElement.remove();
        canIconElement = null;
    }
    
    // Detach all event listeners to prevent memory leaks
    window.removeEventListener('mousemove', handleMouseMoveForCan);
    if (headingElementForCan) {
        headingElementForCan.classList.remove('blooming');
        headingElementForCan.removeEventListener('mouseenter', handleHeadingEnterForCan);
        headingElementForCan.removeEventListener('mouseleave', handleHeadingLeaveForCan);
        headingElementForCan = null;
    }
}

});
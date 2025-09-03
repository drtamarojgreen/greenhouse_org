// --- Vine Growth Effect ---

// This function will be called by the controller when the user selects this effect.
function activateVineEffect() {
    const heading = document.getElementById('effect-heading');
    if (!heading) return;

    // Store original text and prevent re-initialization
    if (!heading.dataset.originalText) {
        heading.dataset.originalText = heading.textContent;
    }
    if (heading.dataset.vineInitialized === 'true') return;
    heading.dataset.vineInitialized = 'true';

    // Wrap each letter in a span for individual animation
    heading.innerHTML = heading.dataset.originalText.split('').map(char => {
        // Preserve spaces
        if (char === ' ') {
            return `<span>&nbsp;</span>`;
        }
        return `<span>${char}</span>`;
    }).join('');

    // Create and inject the SVG for the vine
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "vine-svg");
    svg.setAttribute("viewBox", "0 0 800 120"); // Adjusted viewBox for better fit

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("class", "vine-path");
    // A flowing path for the vine
    path.setAttribute("d", "M10,110 C150,-30 250,150 400,60 S550,-30 700,60 S790,100 790,100");
    
    svg.appendChild(path);
    heading.appendChild(svg);

    // Calculate the total length of the path
    const pathLength = path.getTotalLength();

    // Set CSS custom properties for the animation
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;

    // Trigger the animation by adding the 'animation-running' class after a brief delay
    setTimeout(() => {
        // This class starts the CSS transitions/animations
        document.body.classList.add('animation-running');
        
        // Stagger the letter animations
        const letters = heading.querySelectorAll('span');
        letters.forEach((letter, index) => {
            letter.style.transitionDelay = `${index * 50}ms`;
        });
    }, 100);
}

// This function will be called by the controller to clean up the effect.
function deactivateVineEffect() {
    const heading = document.getElementById('effect-heading');
    if (!heading || heading.dataset.vineInitialized !== 'true') return;

    document.body.classList.remove('animation-running');
    
    // Restore the original heading text
    if(heading.dataset.originalText) {
        heading.innerHTML = heading.dataset.originalText;
    }

    // Clean up the DOM and state
    delete heading.dataset.vineInitialized;
    const svg = heading.querySelector('.vine-svg');
    if (svg) {
        svg.remove();
    }
}
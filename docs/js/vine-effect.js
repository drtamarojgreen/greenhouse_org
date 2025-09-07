(function() {
    'use strict';

    const config = {
        elementWaitTimeout: 10000,
        textToFind: "GREENHOUSE FOR MENTAL HEALTH DEVELOPMENT",
        idToApply: "greenhouse-title-for-vine-effect"
    };

    function waitForElementByText(text, timeout = config.elementWaitTimeout) {
        return new Promise((resolve, reject) => {
            const findElement = () => {
                const allElements = document.querySelectorAll('h1, h2, h3, p, span, div');
                for (let i = 0; i < allElements.length; i++) {
                    if (allElements[i].textContent.trim().toUpperCase() === text) {
                        return allElements[i];
                    }
                }
                return null;
            };

            let element = findElement();
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                element = findElement();
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element with text "${text}" not found.`));
            }, timeout);
        });
    }

    async function activateVineEffect() {
        try {
            const heading = await waitForElementByText(config.textToFind);
            if (!heading || heading.dataset.vineInitialized === 'true') return;

            heading.id = config.idToApply;
            heading.dataset.originalText = heading.textContent;
            heading.dataset.vineInitialized = 'true';
            heading.classList.add('vine-effect-active');

            heading.innerHTML = heading.dataset.originalText.split('').map(char => {
                return `<span>${char === ' ' ? '&nbsp;' : char}</span>`;
            }).join('');

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("class", "vine-svg");
            svg.setAttribute("viewBox", "0 0 800 120");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", "vine-path");
            path.setAttribute("d", "M10,110 C150,-30 250,150 400,60 S550,-30 700,60 S790,100 790,100");

            svg.appendChild(path);
            heading.appendChild(svg);

            const pathLength = path.getTotalLength();
            path.style.strokeDasharray = pathLength;
            path.style.strokeDashoffset = pathLength;

            setTimeout(() => {
                heading.classList.add('animation-running');
            }, 100);

        } catch (error) {
            console.error('Vine Effect Error:', error);
        }
    }

    function initialize() {
        activateVineEffect();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // Give Wix a moment to finish rendering
        setTimeout(initialize, 500);
    }

})();
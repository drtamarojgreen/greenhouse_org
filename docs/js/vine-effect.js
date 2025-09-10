(function() {
    'use strict';

    const config = {
        elementWaitTimeout: 10000,
        targetSelector: "#SITE_PAGES_TRANSITION_GROUP div section.wixui-section:nth-child(1) div section div > div > div.wixui-rich-text h2", // New config for selector
        idToApply: "greenhouse-title-for-vine-effect"
    };

    function waitForElementBySelector(selector, timeout = config.elementWaitTimeout) {
        return new Promise((resolve, reject) => {
            const findElement = () => {
                return document.querySelector(selector);
            };

            let element = findElement();
            if (element) {
                console.log(`Vine Effect: Element found with selector: ${selector}`); // Added log
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
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element with selector "${selector}" not found.`));
            }, timeout);
        });
    }

    async function activateVineEffect() {
        try {
            const heading = await waitForElementBySelector(config.targetSelector);
            if (!heading || heading.dataset.vineInitialized === 'true') return;

            heading.id = config.idToApply;
            const originalText = heading.textContent;
            heading.dataset.originalText = originalText;
            heading.dataset.vineInitialized = 'true';
            heading.classList.add('vine-effect-active');

            // Get dimensions before modifying innerHTML
            const rect = heading.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Lock the width and display to prevent wrapping
            heading.style.width = `${width}px`;
            heading.style.display = 'inline-block';

            heading.innerHTML = originalText.split('').map(char => {
                return `<span>${char === ' ' ? '&nbsp;' : char}</span>`;
            }).join('');

            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("class", "vine-svg");

            // Dynamic scaling
            svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", "vine-path");
            // Adjusted path to scale with the dynamic viewBox
            path.setAttribute("d", `M${width*0.01},${height*0.9} C${width*0.1875},-0.25 ${width*0.3125},${height*1.25} ${width*0.5},${height*0.5} S${width*0.6875},-0.25 ${width*0.875},${height*0.5} S${width*0.9875},${height*0.833} ${width*0.9875},${height*0.833}`);

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
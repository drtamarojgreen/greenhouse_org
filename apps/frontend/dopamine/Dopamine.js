import wixWindow from 'wix-window';

$w.onReady(function () {
    if (wixWindow.formFactor === "Desktop" || wixWindow.formFactor === "Tablet" || wixWindow.formFactor === "Mobile") {
        initDopamineSimulation();
    }
});

function initDopamineSimulation() {
    const targetSelector = "#dopamineSectionMain";
    console.log("Dopamine Signaling Simulation Page Ready");
}

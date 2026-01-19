import wixWindow from 'wix-window';

$w.onReady(function () {
    if (wixWindow.formFactor === "Desktop" || wixWindow.formFactor === "Tablet" || wixWindow.formFactor === "Mobile") {
        initSerotoninSimulation();
    }
});

function initSerotoninSimulation() {
    const targetSelector = "#serotoninSectionMain";
    console.log("Serotonin Structural Model Page Ready");
}

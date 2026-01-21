/**
 * @file dopamine_electrophysiology.js
 * @description Electrophysiological components for Dopamine Simulation.
 * Covers Enhancements 46-60.
 */

(function () {
    'use strict';
    const G = window.GreenhouseDopamine || {};
    window.GreenhouseDopamine = G;

    G.electroState = {
        membranePotential: -80, // mV
        threshold: -50,
        channels: {
            girk: 0,   // 46. GIRK
            hcn: 0.1,  // 47. HCN
            nmda: 0.2, // 49. NMDA
            ampa: 0.5, // 50. AMPA
            kir2: 0.8, // 52. Kir2 (MSN down-state)
            nav16: 1.0,// 51. Nav1.6
            ltypeCa: 0.2, // 48. L-type Ca2+
            sk: 0.1, // 56. SK Channels
            cl: 0.1 // 58. Shunting Inhibition (Chloride)
        },
        isUpState: false,
        spikeCount: 0,
        stdpWindow: 0, // 59. STDP Dopamine-gate
        inputResistance: 1.0, // 60. Input Resistance scaling
        ahpCurrent: 0, // 56. Afterhyperpolarization
        ampaTrafficking: 1.0, // 50. AMPA Receptor Trafficking
        tonicGaba: 0.2 // 55. Tonic GABAergic Inhibition
    };

    G.updateElectrophysiology = function () {
        const state = G.state;
        const eState = G.electroState;
        const mState = G.molecularState;
        const sState = G.synapseState;

        // 46. GIRK Channel Activation (by D2/Gi)
        if (state.mode.includes('D2') && state.signalingActive) {
            eState.channels.girk = Math.min(1, eState.channels.girk + 0.015);
        } else {
            eState.channels.girk = Math.max(0, eState.channels.girk - 0.008);
        }

        // 47. HCN Channel Modulation (by cAMP)
        if (mState && mState.campMicrodomains.length > 5) {
            eState.channels.hcn = Math.min(1.2, eState.channels.hcn + 0.01);
        } else {
            eState.channels.hcn = Math.max(0.1, eState.channels.hcn - 0.005);
        }

        // 48. L-type Ca2+ Modulation
        if (state.mode.includes('D1') && state.signalingActive) {
            eState.channels.ltypeCa = Math.min(1.5, eState.channels.ltypeCa + 0.01);
        } else if (state.mode.includes('D2') && state.signalingActive) {
            eState.channels.ltypeCa = Math.max(0.05, eState.channels.ltypeCa - 0.01);
        }

        // 53. Up-state/Down-state Transitions
        let targetPotential = -85; // Default "Down-state"

        // Influence of DA and Synaptic input
        const daConcentration = sState ? sState.cleftDA.length : 0;
        if (daConcentration > 40) {
            targetPotential += (daConcentration / 100) * 15;
        }

        // Kir2 contributes to Down-state stability
        targetPotential -= eState.channels.kir2 * 5;

        // 53. Transitions triggered by DA mode
        if (state.mode.includes('D1') && state.signalingActive) {
            targetPotential += 20; // Facilitate Up-state
            eState.channels.kir2 *= 0.99; // D1 reduces Kir conductance
        } else {
            eState.channels.kir2 = Math.min(1.0, eState.channels.kir2 + 0.01);
        }

        // GIRK effect (Hyperpolarization)
        targetPotential -= eState.channels.girk * 20;

        // HCN effect (Depolarization, Ih current)
        targetPotential += eState.channels.hcn * 12;

        // 51. Nav1.6 Modulation by Dopamine
        if (state.signalingActive) {
            eState.channels.nav16 = 1.0 + (state.mode.includes('D1') ? 0.2 : -0.15);
        }

        // Smooth transition (RC circuit simulation)
        eState.membranePotential += (targetPotential - eState.membranePotential) * 0.04;

        // 50. AMPA Receptor Trafficking
        // DA-mediated plasticity increases surface AMPA
        if (state.signalingActive && state.mode.includes('D1')) {
            eState.ampaTrafficking = Math.min(2.0, eState.ampaTrafficking + 0.005);
        } else if (state.signalingActive && state.mode.includes('D2')) {
            eState.ampaTrafficking = Math.max(0.5, eState.ampaTrafficking - 0.002);
        }

        // 58. Shunting Inhibition & 55. Tonic GABA
        // GABAergic input increases chloride conductance, pulling potential towards Ecl
        const ecl = -70;
        const gabaConductance = eState.tonicGaba + eState.channels.cl;
        targetPotential = (targetPotential + gabaConductance * ecl) / (1 + gabaConductance);

        // 60. Input Resistance Scaling
        eState.inputResistance = 1.0 / (0.5 + eState.channels.girk + eState.channels.kir2 + eState.channels.hcn + gabaConductance);
        eState.isUpState = eState.membranePotential > -62;

        // 59. STDP Dopamine-gate Window
        if (daConcentration > 50 || state.mode === 'Phasic Burst') {
            eState.stdpWindow = Math.min(1, eState.stdpWindow + 0.1);
        } else {
            eState.stdpWindow = Math.max(0, eState.stdpWindow - 0.01);
        }

        // 56. SK Channel modulation and AHP
        // SK channels are activated by Calcium rise during spikes
        if (mState && mState.plcPathway && mState.plcPathway.ip3 > 0.5) {
             eState.channels.sk = Math.min(1, eState.channels.sk + 0.05);
        } else {
             eState.channels.sk = Math.max(0.1, eState.channels.sk - 0.01);
        }

        // AHP current decays over time
        eState.ahpCurrent *= 0.95;
        eState.membranePotential -= eState.ahpCurrent;

        // Simple Spike generation (influenced by Nav1.6)
        if (eState.membranePotential > eState.threshold && Math.random() > (1.1 - eState.channels.nav16 * 0.2)) {
            eState.spikeCount++;
            eState.membranePotential = 35; // Spike peak

            // 56. Trigger AHP current based on SK channels
            eState.ahpCurrent = eState.channels.sk * 30;

            setTimeout(() => {
                eState.membranePotential = -95; // 56. Afterhyperpolarization (AHP)
            }, 5);
        }
    };

    G.renderElectrophysiology = function (ctx, project) {
        const w = G.width;
        const h = G.height;
        const eState = G.electroState;

        // Render Membrane Potential Graph
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, h - 150);
        ctx.lineTo(w / 4, h - 150);
        ctx.stroke();

        // Potential indicator
        const yPos = h - 150 - (eState.membranePotential + 80) * 2;
        ctx.fillStyle = eState.isUpState ? '#ff5555' : '#55ff55';
        ctx.beginPath();
        ctx.arc(w / 8, yPos, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Membrane Potential: ${eState.membranePotential.toFixed(1)} mV`, 10, h - 200);
        ctx.fillText(`State: ${eState.isUpState ? 'UP-STATE' : 'DOWN-STATE'}`, 10, h - 180);
        ctx.fillText(`Spikes: ${eState.spikeCount}`, 10, h - 160);

        // Render Channel Status
        ctx.fillText(`GIRK: ${(eState.channels.girk * 100).toFixed(0)}%`, 10, h - 240);
        ctx.fillText(`HCN: ${(eState.channels.hcn * 100).toFixed(0)}%`, 10, h - 220);
    };
})();

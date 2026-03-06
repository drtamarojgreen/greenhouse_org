// docs/js/dna_replication.js
// DNA Replication Simulation Module
// Demonstrates Replication Fork, DNA Polymerase, Helicase, Leading/Lagging strands

(function () {
    'use strict';

    window.GreenhouseDNARepair = window.GreenhouseDNARepair || {};
    const G = window.GreenhouseDNARepair;

    G.handleReplication = function(t) {
        const st = this.state;
        const config = this.config;

        // Speed of replication
        const speed = 0.1;
        const forkIndex = Math.floor((t * speed) % config.helixLength);
        st.replicationForkIndex = forkIndex;

        // Reset offsets first
        st.basePairs.forEach(p => {
            p.s1Offset = { y: 0, z: 0 };
            p.s2Offset = { y: 0, z: 0 };
            p.isReplicating = false;
            p.newBase1 = null;
            p.newBase2 = null;
        });

        // Helicase / Fork logic
        for (let i = 0; i < config.helixLength; i++) {
            const p = st.basePairs[i];
            if (i < forkIndex) {
                // Diverge strands
                const divergence = Math.min(60, (forkIndex - i) * 5);
                const angle = p.angle * (1 - (st.globalHelixUnwind || 0) * 0.8);

                // Strand 1 moves "up"
                p.s1Offset.y = Math.cos(angle) * divergence;
                p.s1Offset.z = Math.sin(angle) * divergence;

                // Strand 2 moves "down"
                p.s2Offset.y = Math.cos(angle + Math.PI) * divergence;
                p.s2Offset.z = Math.sin(angle + Math.PI) * divergence;

                p.isReplicating = true;

                // Leading strand synthesis (Strand 1)
                // Polymerase follows helicase
                if (i < forkIndex - 5) {
                    p.newBase1 = G.getComplement(p.base1);
                }

                // Lagging strand synthesis (Strand 2) - Okazaki fragments
                // Synthesized in bursts
                const okazakiSize = 10;
                const burstIndex = Math.floor(i / okazakiSize);
                const burstProgress = (forkIndex % (okazakiSize * 2));

                if (i < forkIndex - 15) {
                    p.newBase2 = G.getComplement(p.base2);
                }
            }
        }

        // Visualize Enzymes
        if (forkIndex < config.helixLength) {
            const forkP = st.basePairs[forkIndex];
            // Helicase (Purple)
            this.spawnParticles(forkP.x, 0, 0, 5, '#9d00ff');

            // Polymerase Leading (Orange)
            if (forkIndex > 5) {
                const leadP = st.basePairs[forkIndex - 5];
                this.spawnParticles(leadP.x, leadP.s1Offset.y, leadP.s1Offset.z, 2, '#ff9900');
            }

            // Polymerase Lagging (Red-Orange)
            if (forkIndex > 15) {
                const lagP = st.basePairs[forkIndex - 15];
                this.spawnParticles(lagP.x, lagP.s2Offset.y, lagP.s2Offset.z, 2, '#ff5500');
            }
        }

        // Free Nucleotides
        if (t % 10 === 0) {
            const x = (Math.random() - 0.5) * 800;
            const y = (Math.random() - 0.5) * 600;
            const colors = Object.values(config.colors).slice(0, 4);
            this.spawnParticles(x, y, 100, 1, colors[Math.floor(Math.random() * 4)]);
        }

        if (t === 599) {
            this.state.successfulRepairs++; // Simulation complete
        }
    };

    G.getComplement = function(base) {
        switch(base) {
            case 'A': return 'T';
            case 'T': return 'A';
            case 'C': return 'G';
            case 'G': return 'C';
            default: return '';
        }
    };

})();

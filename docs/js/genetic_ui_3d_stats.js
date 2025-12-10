(function () {
    'use strict';

    const GreenhouseGeneticStats = {
        eventLog: [],

        logEvent(messageKey) {
            const util = window.GreenhouseModelsUtil;
            const message = util ? util.t(messageKey) : messageKey;
            this.eventLog.unshift({ message, timestamp: Date.now() });
            if (this.eventLog.length > 5) this.eventLog.pop();
        },

        drawEventLog(ctx, canvasHeight) {
            if (this.eventLog.length === 0) return;

            const x = 20;
            let y = canvasHeight - 30;
            const now = Date.now();

            ctx.font = '14px monospace';

            this.eventLog.forEach((log, index) => {
                const age = now - log.timestamp;
                if (age > 3000) return; // Hide after 3s

                const alpha = Math.max(0, 1 - age / 3000);
                ctx.fillStyle = `rgba(168, 218, 220, ${alpha})`; // Soft Blue text
                ctx.fillText(`> ${log.message}`, x, y);
                y -= 20;
            });
        },

        drawOverlayInfo(ctx, canvasWidth, activeGene) {
            if (!activeGene) return;

            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            const idStr = (activeGene.id !== undefined) ? String(activeGene.id) : 'Unknown';
            const labelStr = activeGene.label ? ` (${activeGene.label})` : '';
            ctx.fillText(`Active Gene: ${idStr}${labelStr}`, canvasWidth / 2, 30);
        },

        drawControls(ctx, canvasWidth, canvasHeight) {
            const w = canvasWidth;
            const h = canvasHeight;
            const btnW = 100;
            const btnH = 30;
            const gap = 20;

            // Previous Button
            const prevX = w / 2 - btnW - gap / 2;
            const prevY = h - 50;

            ctx.fillStyle = 'rgba(0, 255, 204, 0.2)';
            ctx.strokeStyle = '#00ffcc';
            ctx.lineWidth = 1;
            ctx.fillRect(prevX, prevY, btnW, btnH);
            ctx.strokeRect(prevX, prevY, btnW, btnH);

            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("Previous", prevX + btnW / 2, prevY + 20);

            // Next Button
            const nextX = w / 2 + gap / 2;
            const nextY = h - 50;

            ctx.fillStyle = 'rgba(0, 255, 204, 0.2)';
            ctx.strokeStyle = '#00ffcc';
            ctx.fillRect(nextX, nextY, btnW, btnH);
            ctx.strokeRect(nextX, nextY, btnW, btnH);

            ctx.fillStyle = '#fff';
            ctx.fillText("Next", nextX + btnW / 2, nextY + 20);
        },

        drawLabels(ctx, projectedNeurons) {
            const util = window.GreenhouseModelsUtil;
            if (!util || projectedNeurons.length === 0) return;

            // Label Brain Regions
            const regions = {};
            projectedNeurons.forEach(p => {
                if (p.type === 'neuron' && p.region) {
                    if (!regions[p.region]) regions[p.region] = { x: 0, y: 0, count: 0 };
                    regions[p.region].x += p.x;
                    regions[p.region].y += p.y;
                    regions[p.region].count++;
                }
            });

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';

            for (const [name, data] of Object.entries(regions)) {
                if (data.count > 0) {
                    const cx = data.x / data.count;
                    const cy = data.y / data.count;
                    ctx.fillText(name, cx, cy - 15);
                }
            }

            // Label "Genotype" and "Phenotype"
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText("Genotype (DNA)", 200, 50);
            ctx.fillText("Phenotype (Brain)", 600, 50);

            ctx.textAlign = 'left';
        },

        drawSignalFlow(ctx, isEvolving) {
            // Visualize signals moving from Helix (left) to Brain (right)
            // We can just draw random particles flowing rightward
            const now = Date.now();
            const flowSpeed = 0.1;

            if (isEvolving) {
                const particleCount = 10;
                for (let i = 0; i < particleCount; i++) {
                    const t = (now * 0.001 + i * 0.1) % 1; // 0 to 1 loop
                    // Start near Helix (x ~ 200), End near Brain (x ~ 600)
                    // Assuming canvas width 800
                    const startX = 200;
                    const endX = 600;
                    const currentX = startX + (endX - startX) * t;
                    const y = 300 + Math.sin(t * 10 + i) * 50; // Wavy path

                    const alpha = Math.sin(t * Math.PI); // Fade in/out

                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(currentX, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    };

    window.GreenhouseGeneticStats = GreenhouseGeneticStats;
})();

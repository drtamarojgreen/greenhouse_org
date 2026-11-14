/**
 * @file neuro_ui_3d_stats.ts
 * @description Stats and Event Logging UI for Neuro simulation.
 */

/// <reference path="../types/globals.d.ts" />

export interface LogEntry {
    message: string;
    timestamp: number;
}

export const GreenhouseNeuroStats = {
    eventLog: [] as LogEntry[],

    logEvent(messageKey: string) {
        const util = (window as any).GreenhouseModelsUtil;
        const message = util ? util.t(messageKey) : messageKey;
        this.eventLog.unshift({ message, timestamp: Date.now() });
        if (this.eventLog.length > 5) this.eventLog.pop();
    },

    drawEventLog(ctx: CanvasRenderingContext2D, canvasHeight: number) {
        if (this.eventLog.length === 0) return;

        const x = 20;
        let y = canvasHeight - 30;
        const now = Date.now();

        ctx.font = '14px monospace';

        this.eventLog.forEach((log) => {
            const age = now - log.timestamp;
            if (age > 3000) return; // Hide after 3s

            const alpha = Math.max(0, 1 - age / 3000);
            ctx.fillStyle = `rgba(168, 218, 220, ${alpha})`; // Soft Blue text
            ctx.fillText(`> ${log.message}`, x, y);
            y -= 20;
        });
    },

    drawStats(ctx: CanvasRenderingContext2D, neuronCount: number, connectionCount: number) {
        const util = (window as any).GreenhouseModelsUtil;
        const t = util ? util.t.bind(util) : (k: string) => k;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px monospace';
        ctx.fillText(`${t("Neurons")}: ${neuronCount}`, 20, 30);
        ctx.fillText(`${t("Connections")}: ${connectionCount}`, 20, 50);

        ctx.fillStyle = '#D0D0D0';
        ctx.fillText(t("Click PiP to select connection"), 20, 80);
    },

    drawLabels(ctx: CanvasRenderingContext2D, projectedNeurons: any[]) {
        const util = (window as any).GreenhouseModelsUtil;
        if (projectedNeurons.length === 0) return;

        const t = util ? util.t.bind(util) : (k: string) => k;

        // Label Regions instead of individual neurons
        const regions: Record<string, { x: number, y: number, count: number }> = {};
        projectedNeurons.forEach(p => {
            if (!regions[p.region]) regions[p.region] = { x: 0, y: 0, count: 0 };
            regions[p.region].x += p.x;
            regions[p.region].y += p.y;
            regions[p.region].count++;
        });

        const labelList: { name: string, x: number, y: number }[] = [];
        for (const [name, data] of Object.entries(regions)) {
            if (data.count > 0) {
                labelList.push({
                    name: name,
                    x: data.x / data.count,
                    y: data.y / data.count - 20
                });
            }
        }

        ctx.font = 'bold 11px Quicksand, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const drawnLabels: { x: number, y: number }[] = [];

        labelList.forEach(label => {
            // Check collision with already drawn labels
            let collision = false;
            for (const other of drawnLabels) {
                const dx = label.x - other.x;
                const dy = label.y - other.y;
                // Approximate text size collision (width ~80, height ~20)
                if (Math.abs(dx) < 80 && Math.abs(dy) < 20) {
                    collision = true;
                    break;
                }
            }

            if (!collision) {
                // Draw Label with background for readability
                const text = t(label.name).toUpperCase();
                const textWidth = ctx.measureText(text).width;
                const paddingH = 6;
                const paddingV = 4;
                const h = 14;

                // Rounded background
                ctx.fillStyle = 'rgba(10, 15, 25, 0.7)';
                ctx.strokeStyle = 'rgba(76, 161, 175, 0.5)';
                ctx.lineWidth = 1;

                const rx = label.x - textWidth / 2 - paddingH;
                const ry = label.y - h / 2 - paddingV;
                const rw = textWidth + paddingH * 2;
                const rh = h + paddingV * 2;

                // Manual round rect for stats (not using app.roundRect to keep it decoupled)
                ctx.beginPath();
                if ((ctx as any).roundRect) {
                    (ctx as any).roundRect(rx, ry, rw, rh, 4);
                } else {
                    ctx.rect(rx, ry, rw, rh);
                }
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.fillText(text, label.x, label.y);

                drawnLabels.push(label);
            }
        });

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }
};

(window as any).GreenhouseNeuroStats = GreenhouseNeuroStats;

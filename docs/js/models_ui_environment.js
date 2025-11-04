
(function() {
    'use strict';

    const GreenhouseModelsUIEnvironment = {
        drawEnvironmentView() {
            const ctx = this.contexts.environment;
            if (!ctx) return;
            const canvas = this.canvases.environment;
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            // Draw brain outline
            ctx.strokeStyle = '#2d3e2d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width / 2, 50);
            ctx.bezierCurveTo(width / 4, 50, width / 4, height / 2, width / 2, height - 50);
            ctx.bezierCurveTo(width * 3 / 4, height / 2, width * 3 / 4, 50, width / 2, 50);
            ctx.stroke();

            // Draw icons
            const factors = ['community', 'society', 'genetics', 'environment'];
            factors.forEach((factor, index) => {
                const angle = (index / factors.length) * 2 * Math.PI;
                const x = width / 2 + Math.cos(angle) * 100;
                const y = height / 2 + Math.sin(angle) * 100;
                const value = this.state.environment[factor];

                ctx.fillStyle = `rgba(53, 116, 56, ${value})`;
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, 2 * Math.PI);
                ctx.fill();

                ctx.fillStyle = '#2d3e2d';
                ctx.font = '12px Quicksand, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(factor, x, y + 30);
            });
        }
    };

    window.GreenhouseModelsUIEnvironment = GreenhouseModelsUIEnvironment;
})();

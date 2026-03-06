(function () {
    'use strict';

    const GreenhouseRNALegend = {

        // Configuration
        config: {
            padding: 15,
            itemHeight: 25,
            width: 180,
            backgroundColor: 'rgba(20, 25, 35, 0.8)',
            borderColor: 'rgba(78, 205, 196, 0.5)',
            textColor: '#ffffff',
            titleColor: '#4ECDC4'
        },

        update(ctx, canvasWidth, canvasHeight, colors) {
            // Legend content definition
            const items = [
                { label: 'Adenine (A)', color: colors.A },
                { label: 'Uracil (U)', color: colors.U },
                { label: 'Guanine (G)', color: colors.G },
                { label: 'Cytosine (C)', color: colors.C },
                { label: 'Methylation', color: colors.METHYL },
                { label: 'Enzyme', color: colors.ENZYME }
            ];

            const x = canvasWidth - this.config.width - 20;
            const y = 20;
            const height = items.length * this.config.itemHeight + 40;

            // Draw Background
            ctx.save();
            ctx.fillStyle = this.config.backgroundColor;
            ctx.strokeStyle = this.config.borderColor;
            ctx.lineWidth = 1;

            // Rounded rect
            const r = 8;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + this.config.width - r, y);
            ctx.quadraticCurveTo(x + this.config.width, y, x + this.config.width, y + r);
            ctx.lineTo(x + this.config.width, y + height - r);
            ctx.quadraticCurveTo(x + this.config.width, y + height, x + this.config.width - r, y + height);
            ctx.lineTo(x + r, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();

            ctx.fill();
            ctx.stroke();

            // Draw Title
            ctx.fillStyle = this.config.titleColor;
            ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText("Legend", x + 15, y + 10);

            // Draw Items
            ctx.font = '12px "Helvetica Neue", Arial, sans-serif';
            ctx.textBaseline = 'middle';

            items.forEach((item, index) => {
                const itemY = y + 40 + (index * this.config.itemHeight);

                // Color swatch
                ctx.beginPath();
                ctx.arc(x + 20, itemY, 6, 0, Math.PI * 2);
                ctx.fillStyle = item.color;
                ctx.fill();

                // Stroke for lighter colors if needed
                if (item.label === 'Enzyme') {
                    ctx.strokeStyle = colors.GLOW;
                    ctx.borderWidth = 1;
                    ctx.stroke();
                }

                // Text
                ctx.fillStyle = this.config.textColor;
                ctx.fillText(item.label, x + 35, itemY);
            });

            ctx.restore();
        }
    };

    // Expose to global scope
    window.Greenhouse = window.Greenhouse || {};
    window.Greenhouse.RNALegend = GreenhouseRNALegend;

})();

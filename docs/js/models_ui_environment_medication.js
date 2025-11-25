(function () {
    'use strict';

    const GreenhouseModelsUIEnvironmentMedication = {
        state: null,
        util: null,
        regions: {},

        init(state, util) {
            this.state = state;
            this.util = util;

            if (window.GreenhouseEnvironmentConfig && window.GreenhouseEnvironmentConfig.interactiveElements) {
                const config = window.GreenhouseEnvironmentConfig.interactiveElements.medication;
                if (config) {
                    let description = config.description;

                    // Data Binding
                    if (config.dataSource && window.GreenhouseDataAdapter) {
                        const data = window.GreenhouseDataAdapter.getValue(config.dataSource);
                        if (data && Array.isArray(data)) {
                            // Format the array into a readable list
                            const items = data.map(m => `${m.name} (${m.dosage})`).join(', ');
                            description = `Active Prescriptions: ${items}`;
                        }
                    }

                    this.regions[config.id] = {
                        path: null,
                        name: config.name,
                        description: description,
                        dataSource: config.dataSource, // Store dataSource for expanded view
                        x: config.x,
                        y: config.y,
                        width: config.width,
                        height: config.height,
                        isExpanded: false // Initialize isExpanded state
                    };
                }
            }
        },

        draw(ctx, width, height) {
            // Shared transform logic
            const scale = Math.min(width / 1536, height / 1024) * 0.8;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            Object.values(this.regions).forEach(region => {
                this._drawPill(ctx, region);
            });

            ctx.restore();
        },

        _drawPill(ctx, region) {
            const { x, y, width, height, isExpanded } = region;
            const radius = height / 2;

            ctx.save();

            // Glow if expanded
            if (isExpanded) {
                ctx.shadowColor = 'rgba(255, 215, 0, 0.6)'; // Gold glow
                ctx.shadowBlur = 25;
            }

            // Create the path for the pill shape
            const path = new Path2D();
            path.moveTo(x + radius, y);
            path.lineTo(x + width - radius, y);
            path.arc(x + width - radius, y + radius, radius, Math.PI * 1.5, Math.PI * 0.5, false);
            path.lineTo(x + radius, y + height);
            path.arc(x + radius, y + radius, radius, Math.PI * 0.5, Math.PI * 1.5, false);
            path.closePath();

            region.path = path; // Store the path for hit testing

            ctx.fillStyle = 'rgba(200, 200, 255, 0.95)';
            ctx.fill(path);
            ctx.strokeStyle = isExpanded ? '#FFD700' : 'rgba(0, 0, 100, 1.0)';
            ctx.lineWidth = isExpanded ? 3 : 2;
            ctx.stroke(path);

            // Highlight
            ctx.beginPath();
            ctx.moveTo(x + radius, y + 5);
            ctx.lineTo(x + width - radius, y + 5);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label
            ctx.fillStyle = this.state.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(region.name, x + width / 2, y + height + 18);

            ctx.restore();

            if (isExpanded) {
                this._drawExpandedView(ctx, region);
            }
        },

        _drawExpandedView(ctx, region) {
            const { x, y, width, height, dataSource } = region;

            // Fetch data dynamically
            let data = [];
            if (dataSource && window.GreenhouseDataAdapter) {
                data = window.GreenhouseDataAdapter.getValue(dataSource) || [];
            }

            const panelX = x + width + 20;
            const panelY = y - 50;
            const panelWidth = 300;
            const rowHeight = 30;
            const headerHeight = 40;
            const panelHeight = headerHeight + (Math.max(1, data.length) * rowHeight) + 10;

            ctx.save();

            // Panel Background (Glassmorphism)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 5;

            ctx.beginPath();
            ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
            ctx.fill();

            // Border
            ctx.strokeStyle = 'rgba(0, 0, 100, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Header
            ctx.fillStyle = '#f8f9fa';
            ctx.beginPath();
            ctx.roundRect(panelX, panelY, panelWidth, headerHeight, [12, 12, 0, 0]);
            ctx.fill();

            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Active Prescriptions', panelX + 15, panelY + 25);

            // Connecting Line
            ctx.beginPath();
            ctx.moveTo(x + width, y + height / 2);
            ctx.lineTo(panelX, y + height / 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Table Content
            ctx.font = '13px "Helvetica Neue", Arial, sans-serif';

            if (data.length === 0) {
                ctx.fillStyle = '#666';
                ctx.fillText('No active medications.', panelX + 15, panelY + headerHeight + 20);
            } else {
                data.forEach((item, index) => {
                    const rowY = panelY + headerHeight + (index * rowHeight);

                    // Alternating row background
                    if (index % 2 === 0) {
                        ctx.fillStyle = 'rgba(0, 0, 100, 0.03)';
                        ctx.fillRect(panelX, rowY, panelWidth, rowHeight);
                    }

                    // Medication Name
                    ctx.fillStyle = '#2c3e50';
                    ctx.textAlign = 'left';
                    ctx.font = 'bold 13px "Helvetica Neue", Arial, sans-serif';
                    ctx.fillText(item.name, panelX + 15, rowY + 20);

                    // Dosage
                    ctx.fillStyle = '#666';
                    ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(item.dosage, panelX + panelWidth - 15, rowY + 20);

                    // Type (Subtext)
                    ctx.fillStyle = '#888';
                    ctx.font = 'italic 11px "Helvetica Neue", Arial, sans-serif';
                    ctx.textAlign = 'left';
                    const nameWidth = ctx.measureText(item.name).width;
                    ctx.fillText(item.type, panelX + 15 + nameWidth + 10, rowY + 20);
                });
            }

            ctx.restore();
        },

        handleMouseMove(event, canvas, ctx) {
            if (!this.state || !this.regions) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Shared transform logic to map mouse to logical coordinates
            const width = canvas.width;
            const height = canvas.height;
            const scale = Math.min(width / 1536, height / 1024) * 0.8;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            const logicalX = (mouseX - offsetX) / scale;
            const logicalY = (mouseY - offsetY) / scale;

            Object.values(this.regions).forEach(region => {
                // Simple bounding box check
                if (logicalX >= region.x && logicalX <= region.x + region.width &&
                    logicalY >= region.y && logicalY <= region.y + region.height) {

                    // Delegate to Hovers module
                    if (window.GreenhouseModelsUIEnvironmentHovers) {
                        window.GreenhouseModelsUIEnvironmentHovers.setHoverState({
                            active: true,
                            x: mouseX,
                            y: mouseY,
                            content: region.description,
                            title: region.name
                        });
                    }
                }
            });
        },

        handleClick(event, canvas, ctx) {
            if (!this.state || !this.regions) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const width = canvas.width;
            const height = canvas.height;
            const scale = Math.min(width / 1536, height / 1024) * 0.8;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            const logicalX = (mouseX - offsetX) / scale;
            const logicalY = (mouseY - offsetY) / scale;

            let needsRedraw = false;
            Object.values(this.regions).forEach(region => {
                if (logicalX >= region.x && logicalX <= region.x + region.width &&
                    logicalY >= region.y && logicalY <= region.y + region.height) {

                    region.isExpanded = !region.isExpanded;
                    needsRedraw = true;
                    console.log(`Medication ${region.name} clicked. Expanded: ${region.isExpanded}`);
                }
            });

            if (needsRedraw && window.GreenhouseModelsUI) {
                window.GreenhouseModelsUI.drawEnvironmentView();
            }
        }
    };

    window.GreenhouseModelsUIEnvironmentMedication = GreenhouseModelsUIEnvironmentMedication;
})();

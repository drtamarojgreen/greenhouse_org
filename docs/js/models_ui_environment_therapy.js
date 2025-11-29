(function () {
    'use strict';

    const GreenhouseModelsUIEnvironmentTherapy = {
        state: null,
        util: null,
        regions: {},

        init(state, util) {
            this.state = state;
            this.util = util;

            if (window.GreenhouseEnvironmentConfig && window.GreenhouseEnvironmentConfig.interactiveElements) {
                const config = window.GreenhouseEnvironmentConfig.interactiveElements.therapy;
                if (config) {
                    let description = this.util.t(config.description); // Translate the base description first

                    // Data Binding
                    if (config.dataSource && window.GreenhouseDataAdapter) {
                        const data = window.GreenhouseDataAdapter.getValue(config.dataSource);
                        if (data && Array.isArray(data) && data.length > 0) {
                            // Format the array into a readable list
                            const items = data.map(t => `${t.type} (${t.date})`).join(', ');
                            description = `${this.util.t('Recent Sessions')}: ${items}`; // This was incorrect logic for the hover.
                        }
                    }

                    this.regions[config.id] = {
                        path: null,
                        name: config.name,
                        description: description, // Assign the correctly built description
                        dataSource: config.dataSource, // Store dataSource for expanded view
                        x: config.x,
                        y: config.y,
                        radius: config.radius,
                        isExpanded: false
                    };
                }
            }
        },

        draw(ctx, width, height) {
            // Shared transform logic
            const scale = Math.min(width / 1536, height / 1024) * 0.95;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.scale(scale, scale);

            Object.values(this.regions).forEach(region => {
                this._drawTherapyNode(ctx, region);
            });

            ctx.restore();
        },

        _drawTherapyNode(ctx, region) {
            const { x, y, radius, isExpanded } = region;

            ctx.save();

            // Glow if expanded
            if (isExpanded) {
                ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
                ctx.shadowBlur = 25;
            }

            // Draw background circle (always present for hit detection and visual)
            const path = new Path2D();
            path.arc(x, y, radius, 0, Math.PI * 2);
            region.path = path; // Update path for potential hover module use

            ctx.fillStyle = 'rgba(150, 220, 150, 0.95)';
            ctx.strokeStyle = isExpanded ? '#FFD700' : 'rgba(0, 100, 0, 1.0)';
            ctx.lineWidth = isExpanded ? 3 : 2;
            ctx.fill(path);
            ctx.stroke(path);

            // Reset shadow for icon drawing
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Two stylized figures in conversation
            // Centered relative to the node's x, y
            const person1 = { x: x - 10, y: y };
            const person2 = { x: x + 10, y: y };

            ctx.strokeStyle = isExpanded ? '#FFD700' : 'rgba(0, 50, 0, 1.0)'; // Darker green for the figures, or expanded color
            ctx.lineWidth = isExpanded ? 3 : 2; // Keep line width consistent visually

            // Person 1
            ctx.beginPath();
            ctx.arc(person1.x, person1.y - 5, 5, 0, Math.PI * 2); // Head
            ctx.moveTo(person1.x, person1.y);
            ctx.lineTo(person1.x, person1.y + 15); // Body
            ctx.stroke();

            // Person 2
            ctx.beginPath();
            ctx.arc(person2.x, person2.y - 5, 5, 0, Math.PI * 2); // Head
            ctx.moveTo(person2.x, person2.y);
            ctx.lineTo(person2.x, person2.y + 15); // Body
            ctx.stroke();

            // Label
            const darkMode = window.GreenhouseModelsUI && window.GreenhouseModelsUI.state && window.GreenhouseModelsUI.state.darkMode;
            ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 12px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(region.name, x, y + 35);

            ctx.restore();

            if (isExpanded) {
                this._drawExpandedView(ctx, region);
            }
        },

        _drawExpandedView(ctx, region) {
            const { x, y, radius, dataSource } = region;

            // Fetch data dynamically
            let data = [];
            if (dataSource && window.GreenhouseDataAdapter) {
                data = window.GreenhouseDataAdapter.getValue(dataSource) || [];
            }

            const panelX = x - 320; // Draw to the left of the node
            const panelY = y - 60;
            const panelWidth = 300;
            const itemHeight = 50;
            const headerHeight = 40;
            const panelHeight = headerHeight + (Math.max(1, data.length) * itemHeight) + 10;

            ctx.save();

            // Panel Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 5;

            ctx.beginPath();
            ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
            ctx.fill();

            // Border
            ctx.strokeStyle = 'rgba(0, 100, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Header
            ctx.fillStyle = '#f0fdf4'; // Light green tint
            ctx.beginPath();
            ctx.roundRect(panelX, panelY, panelWidth, headerHeight, [12, 12, 0, 0]);
            ctx.fill();

            ctx.fillStyle = '#14532d'; // Dark green text
            ctx.font = 'bold 14px "Helvetica Neue", Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(this.util.t('Recent Sessions'), panelX + 15, panelY + 25);

            // Connecting Line
            ctx.beginPath();
            ctx.moveTo(x - radius, y);
            ctx.lineTo(panelX + panelWidth, y);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();

            // List Content
            if (data.length === 0) {
                ctx.fillStyle = '#666';
                ctx.font = '13px "Helvetica Neue", Arial, sans-serif';
                ctx.fillText(this.util.t('No recent sessions recorded.'), panelX + 15, panelY + headerHeight + 20);
            } else {
                data.forEach((item, index) => {
                    const itemY = panelY + headerHeight + (index * itemHeight);

                    // Separator line
                    if (index > 0) {
                        ctx.beginPath();
                        ctx.moveTo(panelX + 15, itemY);
                        ctx.lineTo(panelX + panelWidth - 15, itemY);
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }

                    // Date
                    ctx.fillStyle = '#666';
                    ctx.font = '11px "Helvetica Neue", Arial, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(item.date, panelX + panelWidth - 15, itemY + 20);

                    // Type
                    ctx.fillStyle = '#14532d';
                    ctx.font = 'bold 13px "Helvetica Neue", Arial, sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(item.type, panelX + 15, itemY + 20);

                    // Notes (Truncated)
                    ctx.fillStyle = '#4b5563';
                    ctx.font = 'italic 12px "Helvetica Neue", Arial, sans-serif';
                    const notes = item.notes.length > 40 ? item.notes.substring(0, 37) + '...' : item.notes;
                    ctx.fillText(notes, panelX + 15, itemY + 38);
                });
            }

            ctx.restore();
        },

        handleMouseMove(eventOrContext, canvas, ctx) {
            if (!this.state || !this.regions) return;

            // Support both old signature and new optimized signature
            let mouseX, mouseY, logicalX, logicalY;

            if (eventOrContext && eventOrContext.logicalX !== undefined) {
                // New optimized signature: pre-calculated coordinates passed in
                mouseX = eventOrContext.mouseX;
                mouseY = eventOrContext.mouseY;
                logicalX = eventOrContext.logicalX;
                logicalY = eventOrContext.logicalY;
            } else {
                // Old signature: calculate coordinates here (backward compatibility)
                const event = eventOrContext;
                const rect = canvas.getBoundingClientRect();
                mouseX = event.clientX - rect.left;
                mouseY = event.clientY - rect.top;

                // Shared transform logic to map mouse to logical coordinates
                const width = canvas.width;
                const height = canvas.height;
                const scale = Math.min(width / 1536, height / 1024) * 0.95;
                const offsetX = (width - (1536 * scale)) / 2;
                const offsetY = (height - (1024 * scale)) / 2;

                logicalX = (mouseX - offsetX) / scale;
                logicalY = (mouseY - offsetY) / scale;
            }

            let hoveredRegion = null;
            Object.values(this.regions).forEach(region => {
                // Circle hit detection
                const dx = logicalX - region.x;
                const dy = logicalY - region.y;
                if (dx * dx + dy * dy <= region.radius * region.radius) {
                    hoveredRegion = region;
                }
            });

            // Delegate to Hovers module
            if (window.GreenhouseModelsUIEnvironmentHovers && hoveredRegion) {
                window.GreenhouseModelsUIEnvironmentHovers.setHoverState({
                    active: true,
                    x: mouseX,
                    y: mouseY,
                    content: hoveredRegion.description,
                    title: hoveredRegion.name
                });
            }
        },

        handleClick(event, canvas, ctx) {
            if (!this.state || !this.regions) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const width = canvas.width;
            const height = canvas.height;
            const scale = Math.min(width / 1536, height / 1024) * 0.95;
            const offsetX = (width - (1536 * scale)) / 2;
            const offsetY = (height - (1024 * scale)) / 2;

            const logicalX = (mouseX - offsetX) / scale;
            const logicalY = (mouseY - offsetY) / scale;

            let needsRedraw = false;
            Object.values(this.regions).forEach(region => {
                const dx = logicalX - region.x;
                const dy = logicalY - region.y;
                if (dx * dx + dy * dy <= region.radius * region.radius) {
                    region.isExpanded = !region.isExpanded;
                    needsRedraw = true;
                    console.log(`Therapy ${region.name} clicked. Expanded: ${region.isExpanded}`);
                }
            });

            if (needsRedraw && window.GreenhouseModelsUI) {
                window.GreenhouseModelsUI.drawEnvironmentView();
            }
        },

        drawTooltip(ctx) {
            // Delegated to GreenhouseModelsUIEnvironmentHovers
        }
    };

    window.GreenhouseModelsUIEnvironmentTherapy = GreenhouseModelsUIEnvironmentTherapy;
})();

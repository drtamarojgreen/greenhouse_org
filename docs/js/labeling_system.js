// docs/js/labeling_system.js
// Universal Labeling System for Genetic and Neuro Visualizations

(function () {
    'use strict';

    const GreenhouseLabelingSystem = {
        labels: [],
        hoveredLabel: null,
        showLabels: true,
        showLegend: true,

        /**
         * Initialize labeling system
         */
        init() {
            this.labels = [];
            this.hoveredLabel = null;
        },

        /**
         * Add a label to the system
         * @param {Object} label - Label configuration
         * @param {string} label.id - Unique identifier
         * @param {string} label.text - Label text
         * @param {Object} label.position - 3D position {x, y, z}
         * @param {string} label.color - Label color
         * @param {string} label.category - Category (e.g., 'brain', 'dna', 'protein')
         * @param {boolean} label.alwaysShow - Always show or only on hover
         */
        addLabel(label) {
            const existing = this.labels.find(l => l.id === label.id);
            if (existing) {
                Object.assign(existing, label);
            } else {
                this.labels.push({
                    id: label.id,
                    text: label.text,
                    position: label.position,
                    color: label.color || '#ffffff',
                    category: label.category || 'general',
                    alwaysShow: label.alwaysShow !== undefined ? label.alwaysShow : false,
                    visible: true
                });
            }
        },

        /**
         * Remove a label
         * @param {string} id - Label ID
         */
        removeLabel(id) {
            this.labels = this.labels.filter(l => l.id !== id);
        },

        /**
         * Clear all labels
         */
        clearLabels() {
            this.labels = [];
        },

        /**
         * Toggle label visibility
         */
        toggleLabels() {
            this.showLabels = !this.showLabels;
        },

        /**
         * Toggle legend visibility
         */
        toggleLegend() {
            this.showLegend = !this.showLegend;
        },

        /**
         * Draw all labels
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {Object} camera - Camera object
         * @param {Object} projection - Projection object
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         */
        drawLabels(ctx, camera, projection, canvasWidth, canvasHeight) {
            if (!this.showLabels) return;

            ctx.save();
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            this.labels.forEach(label => {
                if (!label.visible) return;

                // Only show if alwaysShow or if hovered
                if (!label.alwaysShow && this.hoveredLabel !== label.id) return;

                // Project 3D position to 2D
                const p = GreenhouseModels3DMath.project3DTo2D(
                    label.position.x,
                    label.position.y,
                    label.position.z,
                    camera,
                    projection
                );

                if (p.scale <= 0) return; // Behind camera

                // Draw leader line
                const leaderLength = 30;
                const leaderEndX = p.x + leaderLength;
                const leaderEndY = p.y - 20;

                ctx.strokeStyle = label.color;
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(leaderEndX, leaderEndY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw label background
                const padding = 5;
                const textMetrics = ctx.measureText(label.text);
                const textWidth = textMetrics.width;
                const textHeight = 16;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(
                    leaderEndX,
                    leaderEndY - textHeight / 2,
                    textWidth + padding * 2,
                    textHeight
                );

                // Draw label border
                ctx.strokeStyle = label.color;
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    leaderEndX,
                    leaderEndY - textHeight / 2,
                    textWidth + padding * 2,
                    textHeight
                );

                // Draw label text
                ctx.fillStyle = label.color;
                ctx.fillText(label.text, leaderEndX + padding, leaderEndY);

                // Draw point marker
                ctx.fillStyle = label.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
        },

        /**
         * Draw legend
         * @param {CanvasRenderingContext2D} ctx - Canvas context
         * @param {number} canvasWidth - Canvas width
         * @param {number} canvasHeight - Canvas height
         */
        drawLegend(ctx, canvasWidth, canvasHeight) {
            if (!this.showLegend) return;

            // Group labels by category
            const categories = {};
            this.labels.forEach(label => {
                if (!categories[label.category]) {
                    categories[label.category] = [];
                }
                categories[label.category].push(label);
            });

            // Draw legend box
            const legendX = 10;
            const legendY = canvasHeight - 150;
            const legendWidth = 200;
            const lineHeight = 20;
            const categoryCount = Object.keys(categories).length;
            const legendHeight = categoryCount * lineHeight + 40;

            ctx.save();

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

            // Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('Legend', legendX + 10, legendY + 10);

            // Categories
            ctx.font = '12px Arial';
            let yOffset = legendY + 35;

            Object.keys(categories).forEach(category => {
                const color = categories[category][0].color;
                const count = categories[category].length;

                // Color box
                ctx.fillStyle = color;
                ctx.fillRect(legendX + 10, yOffset, 12, 12);

                // Category name
                ctx.fillStyle = '#ffffff';
                ctx.fillText(
                    `${this.formatCategoryName(category)} (${count})`,
                    legendX + 30,
                    yOffset + 2
                );

                yOffset += lineHeight;
            });

            ctx.restore();
        },

        /**
         * Format category name for display
         * @param {string} category - Category name
         * @returns {string} Formatted name
         */
        formatCategoryName(category) {
            const names = {
                'brain': 'Brain Regions',
                'dna': 'DNA Elements',
                'protein': 'Proteins',
                'neuron': 'Neurons',
                'synapse': 'Synapses',
                'gene': 'Genes',
                'chromosome': 'Chromosomes',
                'general': 'General'
            };
            return names[category] || category;
        },

        /**
         * Check if mouse is over a label
         * @param {number} mouseX - Mouse X position
         * @param {number} mouseY - Mouse Y position
         * @param {Object} camera - Camera object
         * @param {Object} projection - Projection object
         * @returns {Object|null} Label if found, null otherwise
         */
        hitTest(mouseX, mouseY, camera, projection) {
            if (!this.showLabels) return null;

            for (let i = this.labels.length - 1; i >= 0; i--) {
                const label = this.labels[i];
                if (!label.visible) continue;

                const p = GreenhouseModels3DMath.project3DTo2D(
                    label.position.x,
                    label.position.y,
                    label.position.z,
                    camera,
                    projection
                );

                if (p.scale <= 0) continue;

                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 10) {
                    return label;
                }
            }

            return null;
        },

        /**
         * Set hovered label
         * @param {string|null} labelId - Label ID or null
         */
        setHoveredLabel(labelId) {
            this.hoveredLabel = labelId;
        },

        /**
         * Add brain region labels
         * @param {Object} brainShell - Brain shell object with regions
         */
        addBrainRegionLabels(brainShell) {
            if (!brainShell || !brainShell.regions) return;

            Object.keys(brainShell.regions).forEach(regionKey => {
                const region = brainShell.regions[regionKey];
                if (!region.vertices || region.vertices.length === 0) return;

                // Calculate center of region
                let sumX = 0, sumY = 0, sumZ = 0;
                region.vertices.forEach(vIndex => {
                    const v = brainShell.vertices[vIndex];
                    sumX += v.x;
                    sumY += v.y;
                    sumZ += v.z;
                });

                const count = region.vertices.length;
                const centerX = sumX / count;
                const centerY = sumY / count;
                const centerZ = sumZ / count;

                // Add label
                this.addLabel({
                    id: `brain-${regionKey}`,
                    text: region.name || regionKey,
                    position: { x: centerX, y: centerY, z: centerZ },
                    color: region.color || '#ffffff',
                    category: 'brain',
                    alwaysShow: false
                });
            });
        },

        /**
         * Add DNA labels
         * @param {Array} dnaGenes - Array of DNA gene nodes
         */
        addDNALabels(dnaGenes) {
            if (!dnaGenes || dnaGenes.length === 0) return;

            // Add label for DNA double helix
            const midIndex = Math.floor(dnaGenes.length / 2);
            const midGene = dnaGenes[midIndex];

            this.addLabel({
                id: 'dna-helix',
                text: 'DNA Double Helix',
                position: { x: midGene.x, y: midGene.y, z: midGene.z },
                color: '#00D9FF',
                category: 'dna',
                alwaysShow: true
            });

            // Add labels for specific genes
            dnaGenes.forEach((gene, i) => {
                if (gene.label) {
                    this.addLabel({
                        id: `gene-${i}`,
                        text: gene.label,
                        position: { x: gene.x, y: gene.y, z: gene.z },
                        color: gene.baseColor || '#FFD700',
                        category: 'gene',
                        alwaysShow: false
                    });
                }
            });
        },

        /**
         * Add chromosome label
         * @param {Object} position - 3D position
         */
        addChromosomeLabel(position) {
            this.addLabel({
                id: 'chromosome',
                text: 'Chromosome X',
                position: position,
                color: '#9B59B6',
                category: 'chromosome',
                alwaysShow: true
            });
        },

        /**
         * Add protein label
         * @param {Object} position - 3D position
         * @param {string} name - Protein name
         */
        addProteinLabel(position, name) {
            this.addLabel({
                id: `protein-${name}`,
                text: name,
                position: position,
                color: '#E74C3C',
                category: 'protein',
                alwaysShow: false
            });
        }
    };

    window.GreenhouseLabelingSystem = GreenhouseLabelingSystem;
})();

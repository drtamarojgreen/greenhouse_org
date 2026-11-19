/**
 * V8GraphRenderer.ts
 * Native TS and Canvas 2D Force-Directed Graph Renderer.
 */

import { GreenhouseUtils } from './GreenhouseUtils.js';

export interface V8GraphNode {
    id: string;
    label: string;
    connections: string[];
    weight: number;
    group: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

export interface V8GraphLink {
    source: V8GraphNode;
    target: V8GraphNode;
}

export interface V8GraphData {
    nodes: V8GraphNode[];
    links: V8GraphLink[];
}

const V8GraphRenderer = {
    canvas: null as HTMLCanvasElement | null,
    ctx: null as CanvasRenderingContext2D | null,
    data: { nodes: [], links: [] } as V8GraphData,
    isRunning: false,
    selectedNode: null as V8GraphNode | null,
    width: 800,
    height: 600,
    baseUrl: '',

    init: async function (containerId: string | HTMLElement, baseUrl?: string): Promise<void> {
        console.log('Initializing V8GraphRenderer (Canvas)...');

        // Robust Base URL determination
        this.baseUrl = baseUrl || '';
        if (!this.baseUrl && GreenhouseUtils && GreenhouseUtils.appState && GreenhouseUtils.appState.baseUrl) {
            this.baseUrl = GreenhouseUtils.appState.baseUrl;
        }
        if (!this.baseUrl) {
            this.baseUrl = '/';
        }

        if (!this.baseUrl.endsWith('/')) this.baseUrl += '/';

        const container = (typeof containerId === 'string')
            ? document.querySelector(containerId) as HTMLElement | null
            : containerId;
        if (!container) {
            console.error('V8GraphRenderer: Container not found', containerId);
            return;
        }

        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.backgroundColor = '#050505';

        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        window.addEventListener('resize', () => this.resize());
        this.resize();

        const csvPath = this.baseUrl + 'endpoints/graph.csv';

        try {
            console.log(`V8GraphRenderer: Fetching discovery graph from ${csvPath}`);
            this.data = await this.loadData(csvPath);
            if (this.data.nodes.length > 0) {
                this.initializePhysics();
                this.startSimulation();
                this.setupInteraction();
            } else {
                console.warn('V8GraphRenderer: No data found in CSV.');
                this.renderEmptyState();
            }
        } catch (error: any) {
            console.error('Failed to load discovery graph:', error);
            this.renderErrorState(error?.message || String(error));
        }
    },

    resize: function (): void {
        if (!this.canvas || !this.canvas.parentElement) return;
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight || 600;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    },

    loadData: async function (path: string): Promise<V8GraphData> {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();
        return this.parseCSV(csvText);
    },

    parseCSV: function (text: string): V8GraphData {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const nodes: V8GraphNode[] = [];
        const links: V8GraphLink[] = [];
        const nodeMap = new Map<string, V8GraphNode>();

        if (lines.length < 2) return { nodes, links };

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const parts: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let c = 0; c < line.length; c++) {
                const char = line[c];
                if (char === '"') {
                    if (inQuotes && line[c + 1] === '"') {
                        current += '"';
                        c++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    parts.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            parts.push(current);

            if (parts.length < 5) continue;

            try {
                const node: V8GraphNode = {
                    id: parts[1],
                    label: parts[0],
                    connections: JSON.parse(parts[2]),
                    weight: parseFloat(parts[3]),
                    group: parts[4],
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: 0,
                    vy: 0
                };
                nodes.push(node);
                nodeMap.set(node.id, node);
            } catch (e) {
                console.error('Error parsing node at line ' + i, e, parts[2]);
            }
        }

        nodes.forEach(node => {
            node.connections.forEach(targetId => {
                const targetNode = nodeMap.get(targetId);
                if (targetNode && node.id < targetId) {
                    links.push({
                        source: node,
                        target: targetNode
                    });
                }
            });
        });

        return { nodes, links };
    },

    initializePhysics: function (): void {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const radius = Math.min(this.width, this.height) / 4;

        this.data.nodes.forEach((node, i) => {
            const angle = (i / this.data.nodes.length) * Math.PI * 2;
            node.x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 50;
            node.y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 50;
        });
    },

    startSimulation: function (): void {
        if (this.isRunning) return;
        this.isRunning = true;
        const animate = () => {
            if (!this.isRunning) return;
            this.updatePhysics();
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    },

    stopSimulation: function (): void {
        this.isRunning = false;
    },

    updatePhysics: function (): void {
        const nodes = this.data.nodes;
        const links = this.data.links;
        const k = 0.04;
        const repulsion = 1200;
        const friction = 0.85;

        // Repulsion
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const n1 = nodes[i];
                const n2 = nodes[j];
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const distSq = dx * dx + dy * dy + 1;
                if (distSq < 10000) {
                    const force = repulsion / distSq;
                    const fx = (dx / Math.sqrt(distSq)) * force;
                    const fy = (dy / Math.sqrt(distSq)) * force;
                    n1.vx -= fx;
                    n1.vy -= fy;
                    n2.vx += fx;
                    n2.vy += fy;
                }
            }
        }

        // Attraction
        links.forEach(link => {
            const n1 = link.source;
            const n2 = link.target;
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
            const force = (dist - 60) * k;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            n1.vx += fx;
            n1.vy += fy;
            n2.vx -= fx;
            n2.vy -= fy;
        });

        // Bounds and Gravity
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        nodes.forEach(node => {
            node.vx += (centerX - node.x) * 0.002;
            node.vy += (centerY - node.y) * 0.002;

            node.x += node.vx;
            node.y += node.vy;
            node.vx *= friction;
            node.vy *= friction;
        });
    },

    render: function (): void {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw links
        ctx.strokeStyle = 'rgba(76, 161, 175, 0.15)';
        ctx.lineWidth = 1;
        this.data.links.forEach(link => {
            ctx.beginPath();
            ctx.moveTo(link.source.x, link.source.y);
            ctx.lineTo(link.target.x, link.target.y);
            ctx.stroke();
        });

        // Draw nodes
        this.data.nodes.forEach(node => {
            let radius = Math.sqrt(node.weight) * 2 + 3;
            if (node === this.selectedNode) radius *= 1.5;

            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

            ctx.fillStyle = this.getGroupColor(node.group);
            if (node === this.selectedNode) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = ctx.fillStyle;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.fill();
            ctx.shadowBlur = 0;

            if (node.weight > 4 || node === this.selectedNode) {
                ctx.fillStyle = node === this.selectedNode ? '#fff' : '#aaa';
                ctx.font = node === this.selectedNode ? 'bold 12px Arial' : '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(node.label, node.x, node.y - radius - 5);
            }
        });
    },

    getGroupColor: function (group: string): string {
        switch (group) {
            case 'Disorder': return '#E0E0E0';
            case 'Drug': return '#4da1ff';
            case 'ClinicalTrial': return '#4dffa1';
            case 'Intervention': return '#ffea4d';
            case 'PubMedArticle': return '#D0D0D0';
            case 'Author': return '#888';
            default: return '#666';
        }
    },

    setupInteraction: function (): void {
        if (!this.canvas) return;
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            let found = false;
            this.data.nodes.forEach(node => {
                const dx = node.x - mx;
                const dy = node.y - my;
                if (Math.sqrt(dx * dx + dy * dy) < 15) {
                    this.selectedNode = node;
                    found = true;
                }
            });
            if (!found) this.selectedNode = null;
        });
    },

    renderEmptyState: function (): void {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('No discovery data available.', this.width / 2, this.height / 2);
    },

    renderErrorState: function (msg: string): void {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.fillStyle = '#E0E0E0';
        ctx.textAlign = 'center';
        ctx.fillText('Error: ' + msg, this.width / 2, this.height / 2);
    }
};

export { V8GraphRenderer };

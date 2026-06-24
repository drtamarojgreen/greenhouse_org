/**
 * @file models_util.ts
 * @description Lightweight shared simulation engine and utilities for Greenhouse models.
 */

/// <reference path="types/globals.d.ts" />

/**
 * @class GreenhouseComponent
 * Base class for all visual components in the system.
 */
class GreenhouseComponent {
    name: string;
    layer: number;
    active: boolean = true;
    initialized: boolean = false;
    system?: GreenhouseSystem;

    constructor(name: string, layer: number = 10) {
        this.name = name;
        this.layer = layer;
    }

    /**
     * Called once when the component is added to the system.
     */
    init(system: GreenhouseSystem): void {
        this.system = system;
        this.initialized = true;
    }

    /**
     * Called every frame to update state.
     * @param deltaTime - Time since last frame in ms.
     */
    update(deltaTime: number): void { }

    /**
     * Called every frame to draw to the canvas.
     */
    draw(ctx: CanvasRenderingContext2D, width: number, height: number): void { }
}

/**
 * @class GreenhouseSystem
 * Central rendering engine.
 */
class GreenhouseSystem {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    components: GreenhouseComponent[] = [];
    quality: number;
    lastFrameTime: number = 0;
    errorHandler: (error: any) => void;

    constructor(canvas: HTMLCanvasElement, config: any = {}) {
        this.canvas = canvas;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;
        this.quality = config.quality || 1.0;
        this.errorHandler = config.errorHandler || ((e: any) => console.error("Rendering Error:", e));
    }

    /**
     * Adds a component to the system.
     */
    addComponent(component: GreenhouseComponent): void {
        this.components.push(component);
        this.components.sort((a, b) => a.layer - b.layer);
        if (!component.initialized) {
            component.init(this);
        }
    }

    /**
     * Renders a single frame.
     */
    renderFrame(timestamp: number = performance.now()): void {
        try {
            const deltaTime = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;

            const width = this.canvas.width;
            const height = this.canvas.height;

            this.ctx.clearRect(0, 0, width, height);

            for (const component of this.components) {
                if (component.active) {
                    component.update(deltaTime);
                    component.draw(this.ctx, width, height);
                }
            }

            (window as any).renderingComplete = true;

        } catch (error) {
            this.errorHandler(error);
        }
    }
}

/**
 * @class GreenhouseAssetManager
 * Manages assets and sprite atlases.
 */
class GreenhouseAssetManager {
    assets: Map<string, HTMLImageElement> = new Map();
    loading: boolean = false;

    async loadImage(key: string, url: string): Promise<HTMLImageElement> {
        if (this.assets.has(key)) return this.assets.get(key)!;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.set(key, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    get(key: string): HTMLImageElement | undefined {
        return this.assets.get(key);
    }
}

/**
 * @class SimulationEngine
 * Lightweight shared simulation engine for Greenhouse models.
 */
class SimulationEngine {
    state: Greenhouse.SimulationState;
    updateFn: (state: Greenhouse.SimulationState, dt: number) => void;
    tickRate: number;
    lastTick: number | null = null;
    accumulatedTime: number = 0;

    constructor(config: any = {}) {
        this.state = {
            time: 0,
            factors: config.initialFactors || {},
            metrics: config.initialMetrics || {},
            flags: config.initialFlags || {},
            history: {
                cumulativeLoad: 0,
                peakStress: 0,
                treatmentCycles: 0,
                burnoutEpochs: 0
            },
            seed: config.seed || Math.random()
        };
        this.updateFn = config.updateFn || ((state, dt) => { });
        this.tickRate = config.tickRate || 1000 / 60;
    }

    /**
     * Core update loop with fixed-step updates.
     */
    update(timestamp: number = performance.now()): boolean {
        if (this.lastTick === null) this.lastTick = timestamp;
        const deltaTime = timestamp - this.lastTick;
        this.lastTick = timestamp;

        this.accumulatedTime += deltaTime;

        let updated = false;
        while (this.accumulatedTime >= this.tickRate) {
            this.updateFn(this.state, this.tickRate);
            this.state.time += this.tickRate;
            this.accumulatedTime -= this.tickRate;
            updated = true;
        }
        return updated;
    }

    static clamp(val: number, min: number, max: number): number {
        if (isNaN(val)) return min;
        return Math.max(min, Math.min(max, val));
    }

    static smooth(current: number, target: number, factor: number): number {
        if (isNaN(target)) return current;
        return current + (target - current) * factor;
    }
}

/**
 * @class DiurnalClock
 * Simulates 24-hour biological cycle.
 */
class DiurnalClock {
    timeInHours: number = 8.0;
    dayCount: number = 0;

    update(dtMs: number): void {
        const timeScale = 1 / 1000;
        this.timeInHours += dtMs * timeScale;

        if (this.timeInHours >= 24) {
            this.timeInHours -= 24;
            this.dayCount++;
        }
    }

    getPhase(): number {
        return this.timeInHours / 24;
    }

    getCortisolFactor(): number {
        const h = this.timeInHours;
        const baseline = (Math.cos((h - 8) * (Math.PI / 12)) + 1) / 2;
        const car = (h >= 6 && h <= 9) ? Math.sin((h - 6) * (Math.PI / 3)) * 0.4 : 0;
        return Math.max(0.1, baseline * 0.6 + car);
    }

    getResilienceRecoveryMultiplier(): number {
        const h = this.timeInHours;
        const isSleeping = h > 22 || h < 6;
        return isSleeping ? 2.5 : 1.0;
    }
}

const GreenhouseModelsUtil = {
    GreenhouseComponent,
    GreenhouseSystem,
    GreenhouseAssetManager,
    SimulationEngine,
    DiurnalClock,

    currentLanguage: 'en' as string,

    get translations() {
        return (window as any).GreenhouseTranslations || {};
    },

    createElement(tag: string, attributes: any, ...children: any[]): HTMLElement {
        const element = document.createElement(tag);
        for (const key in attributes) {
            if (key === 'className') {
                element.className = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        }
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        return element;
    },

    parseDynamicPath(pathString: string, context: any): string {
        return pathString.replace(/\b(w|h|tw|psy)\b/g, match => context[match]);
    },

    compute(expr: string | number, context: any): number {
        if (typeof expr === 'number') return expr;
        if (!expr) return 0;

        let result = this.parseDynamicPath(expr, context);
        result = result.replace(/\s+/g, '');

        const ops: Record<string, (a: number, b: number) => number> = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => a / b
        };
        const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

        const tokens = result.split(/([+\-*/])/).filter(t => t.length > 0);
        const values: number[] = [];
        const operators: string[] = [];

        const applyOp = () => {
            const op = operators.pop()!;
            const b = values.pop()!;
            const a = values.pop()!;
            values.push(ops[op](a, b));
        };

        for (let token of tokens) {
            if (ops[token]) {
                while (operators.length > 0 && prec[operators[operators.length - 1]] >= prec[token]) {
                    applyOp();
                }
                operators.push(token);
            } else {
                values.push(parseFloat(token));
            }
        }

        while (operators.length > 0) {
            applyOp();
        }

        return values[0] || 0;
    },

    t(key: string): string {
        const lang = this.currentLanguage;
        if (this.translations[lang] && this.translations[lang][key]) {
            return this.translations[lang][key];
        }
        if (this.translations['en'] && this.translations['en'][key]) {
            return this.translations['en'][key];
        }
        return key;
    },

    setLanguage(lang: string): void {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
        }
    },

    toggleLanguage(): string {
        this.currentLanguage = this.currentLanguage === 'en' ? 'es' : 'en';
        window.dispatchEvent(new CustomEvent('greenhouseLanguageChanged', {
            detail: { language: this.currentLanguage }
        }));
        return this.currentLanguage;
    },

    getRegionDescription(regionKey: string): string {
        const map: Record<string, string> = {
            pfc: 'pfc_desc',
            amygdala: 'amygdala_desc',
            hippocampus: 'hippocampus_desc',
            parietalLobe: 'parietalLobe_desc',
            occipitalLobe: 'occipitalLobe_desc',
            temporalLobe: 'temporalLobe_desc',
            cerebellum: 'cerebellum_desc',
            brainstem: 'brainstem_desc'
        };

        const key = map[regionKey] || 'no_info';
        return this.t(key);
    },

    wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    },

    PathwayService: {
        async loadMetadata(baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/') {
            try {
                const response = await fetch(baseUrl + 'endpoints/models_pathways.json');
                if (!response.ok) return { pathways: [] };
                return await response.json();
            } catch (e) { return { pathways: [] }; }
        },
        async loadJSONPathway(url: string, baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/') {
            try {
                const response = await fetch(baseUrl + url);
                if (!response.ok) return null;
                return await response.json();
            } catch (e) { return null; }
        },
        async loadPathway(url: string, baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/') {
            try {
                const response = await fetch(baseUrl + url);
                if (!response.ok) return null;
                const contentType = response.headers.get('Content-Type');

                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    return (this as any).parseReactomeJSON(data);
                }

                const text = await response.text();
                if (text.trim().startsWith('{')) {
                    return (this as any).parseReactomeJSON(JSON.parse(text));
                }

                return (this as any).parseKGML(text);
            } catch (e) { return null; }
        },
        parseReactomeJSON(data: any) {
            const rawNodes = data.nodes || data.physicalEntities || [];
            const rawEdges = data.edges || data.interactions || [];

            const nodes = rawNodes.map((n: any) => ({
                id: String(n.dbId || n.id || n.stId),
                name: n.displayName || n.name || String(n.dbId),
                type: (this as any).mapReactomeClass(n.renderableClass || n.type),
                x: n.x || (n.minX + (n.maxX - n.minX) / 2) || 400,
                y: n.y || (n.minY + (n.maxY - n.minY) / 2) || 400,
                stId: n.stId,
                region: n.region || null
            }));

            const edges = rawEdges.map((e: any) => ({
                source: String(e.from || e.sourceId || (e.input && e.input[0])),
                target: String(e.to || e.targetId || (e.output && e.output[0])),
                type: e.renderableClass || 'reaction'
            })).filter((e: any) => e.source && e.target);

            return { nodes, edges };
        },
        mapReactomeClass(rc: string) {
            if (!rc) return 'compound';
            const map: Record<string, string> = {
                'Protein': 'gene',
                'Complex': 'map',
                'Chemical': 'compound',
                'Reaction': 'reaction',
                'Pathway': 'map',
                'RNA': 'gene'
            };
            return map[rc] || 'compound';
        },
        parseKGML(xmlText: string) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            const nodes: any[] = [];
            const entries = xmlDoc.getElementsByTagName("entry");
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const graphics = entry.getElementsByTagName("graphics")[0];
                if (graphics) {
                    nodes.push({
                        id: entry.getAttribute("id"),
                        name: graphics.getAttribute("name"),
                        type: entry.getAttribute("type"),
                        x: parseInt(graphics.getAttribute("x") || "0", 10),
                        y: parseInt(graphics.getAttribute("y") || "0", 10),
                        region: entry.getAttribute("region") || null
                    });
                }
            }
            const edges: any[] = [];
            const relations = xmlDoc.getElementsByTagName("relation");
            for (let i = 0; i < relations.length; i++) {
                const rel = relations[i];
                edges.push({ source: rel.getAttribute("entry1"), target: rel.getAttribute("entry2") });
            }
            return { nodes, edges };
        }
    }
};

(window as any).GreenhouseModelsUtil = GreenhouseModelsUtil;
(window as any).GreenhouseBioStatus = {
    stress: { load: 0, hpa: 0, autonomic: 0 },
    inflammation: { tone: 0, bbb: 1, microglia: 0 },
    sync(model: string, stats: any) {
        (this as any)[model] = { ...(this as any)[model], ...stats };
        window.dispatchEvent(new CustomEvent('greenhouseBioUpdate', { detail: { model, stats } }));
    }
};

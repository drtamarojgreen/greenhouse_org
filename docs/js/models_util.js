(function () {
'use strict';
/**
 * @file models_util.ts
 * @description Lightweight shared simulation engine and utilities for Greenhouse models.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference path="types/globals.d.ts" />
/**
 * @class GreenhouseComponent
 * Base class for all visual components in the system.
 */
class GreenhouseComponent {
    constructor(name, layer = 10) {
        this.active = true;
        this.initialized = false;
        this.name = name;
        this.layer = layer;
    }
    /**
     * Called once when the component is added to the system.
     */
    init(system) {
        this.system = system;
        this.initialized = true;
    }
    /**
     * Called every frame to update state.
     * @param deltaTime - Time since last frame in ms.
     */
    update(deltaTime) { }
    /**
     * Called every frame to draw to the canvas.
     */
    draw(ctx, width, height) { }
}
/**
 * @class GreenhouseSystem
 * Central rendering engine.
 */
class GreenhouseSystem {
    constructor(canvas, config = {}) {
        this.components = [];
        this.lastFrameTime = 0;
        this.canvas = canvas;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context)
            throw new Error("Could not get 2D context");
        this.ctx = context;
        this.quality = config.quality || 1.0;
        this.errorHandler = config.errorHandler || ((e) => console.error("Rendering Error:", e));
    }
    /**
     * Adds a component to the system.
     */
    addComponent(component) {
        this.components.push(component);
        this.components.sort((a, b) => a.layer - b.layer);
        if (!component.initialized) {
            component.init(this);
        }
    }
    /**
     * Renders a single frame.
     */
    renderFrame(timestamp = performance.now()) {
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
            window.renderingComplete = true;
        }
        catch (error) {
            this.errorHandler(error);
        }
    }
}
/**
 * @class GreenhouseAssetManager
 * Manages assets and sprite atlases.
 */
class GreenhouseAssetManager {
    constructor() {
        this.assets = new Map();
        this.loading = false;
    }
    loadImage(key, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.assets.has(key))
                return this.assets.get(key);
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.assets.set(key, img);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = url;
            });
        });
    }
    get(key) {
        return this.assets.get(key);
    }
}
/**
 * @class SimulationEngine
 * Lightweight shared simulation engine for Greenhouse models.
 */
class SimulationEngine {
    constructor(config = {}) {
        this.lastTick = null;
        this.accumulatedTime = 0;
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
    update(timestamp = performance.now()) {
        if (this.lastTick === null)
            this.lastTick = timestamp;
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
    static clamp(val, min, max) {
        if (isNaN(val))
            return min;
        return Math.max(min, Math.min(max, val));
    }
    static smooth(current, target, factor) {
        if (isNaN(target))
            return current;
        return current + (target - current) * factor;
    }
}
/**
 * @class DiurnalClock
 * Simulates 24-hour biological cycle.
 */
class DiurnalClock {
    constructor() {
        this.timeInHours = 8.0;
        this.dayCount = 0;
    }
    update(dtMs) {
        const timeScale = 1 / 1000;
        this.timeInHours += dtMs * timeScale;
        if (this.timeInHours >= 24) {
            this.timeInHours -= 24;
            this.dayCount++;
        }
    }
    getPhase() {
        return this.timeInHours / 24;
    }
    getCortisolFactor() {
        const h = this.timeInHours;
        const baseline = (Math.cos((h - 8) * (Math.PI / 12)) + 1) / 2;
        const car = (h >= 6 && h <= 9) ? Math.sin((h - 6) * (Math.PI / 3)) * 0.4 : 0;
        return Math.max(0.1, baseline * 0.6 + car);
    }
    getResilienceRecoveryMultiplier() {
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
    currentLanguage: 'en',
    get translations() {
        return window.GreenhouseTranslations || {};
    },
    createElement(tag, attributes, ...children) {
        const element = document.createElement(tag);
        for (const key in attributes) {
            if (key === 'className') {
                element.className = attributes[key];
            }
            else {
                element.setAttribute(key, attributes[key]);
            }
        }
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            }
            else {
                element.appendChild(child);
            }
        });
        return element;
    },
    parseDynamicPath(pathString, context) {
        return pathString.replace(/\b(w|h|tw|psy)\b/g, match => context[match]);
    },
    compute(expr, context) {
        if (typeof expr === 'number')
            return expr;
        if (!expr)
            return 0;
        let result = this.parseDynamicPath(expr, context);
        result = result.replace(/\s+/g, '');
        const ops = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => a / b
        };
        const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
        const tokens = result.split(/([+\-*/])/).filter(t => t.length > 0);
        const values = [];
        const operators = [];
        const applyOp = () => {
            const op = operators.pop();
            const b = values.pop();
            const a = values.pop();
            values.push(ops[op](a, b));
        };
        for (let token of tokens) {
            if (ops[token]) {
                while (operators.length > 0 && prec[operators[operators.length - 1]] >= prec[token]) {
                    applyOp();
                }
                operators.push(token);
            }
            else {
                values.push(parseFloat(token));
            }
        }
        while (operators.length > 0) {
            applyOp();
        }
        return values[0] || 0;
    },
    t(key) {
        const lang = this.currentLanguage;
        if (this.translations[lang] && this.translations[lang][key]) {
            return this.translations[lang][key];
        }
        if (this.translations['en'] && this.translations['en'][key]) {
            return this.translations['en'][key];
        }
        return key;
    },
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
        }
    },
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'en' ? 'es' : 'en';
        window.dispatchEvent(new CustomEvent('greenhouseLanguageChanged', {
            detail: { language: this.currentLanguage }
        }));
        return this.currentLanguage;
    },
    getRegionDescription(regionKey) {
        const map = {
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
    wrapText(context, text, x, y, maxWidth, lineHeight) {
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
            }
            else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    },
    PathwayService: {
        loadMetadata() {
            return __awaiter(this, arguments, void 0, function* (baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/') {
                try {
                    const response = yield fetch(baseUrl + 'endpoints/models_pathways.json');
                    if (!response.ok)
                        return { pathways: [] };
                    return yield response.json();
                }
                catch (e) {
                    return { pathways: [] };
                }
            });
        },
        loadJSONPathway(url_1) {
            return __awaiter(this, arguments, void 0, function* (url, baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/') {
                try {
                    const response = yield fetch(baseUrl + url);
                    if (!response.ok)
                        return null;
                    return yield response.json();
                }
                catch (e) {
                    return null;
                }
            });
        },
        loadPathway(url_1) {
            return __awaiter(this, arguments, void 0, function* (url, baseUrl = 'https://drtamarojgreen.github.io/greenhouse_org/') {
                try {
                    const response = yield fetch(baseUrl + url);
                    if (!response.ok)
                        return null;
                    const contentType = response.headers.get('Content-Type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = yield response.json();
                        return this.parseReactomeJSON(data);
                    }
                    const text = yield response.text();
                    if (text.trim().startsWith('{')) {
                        return this.parseReactomeJSON(JSON.parse(text));
                    }
                    return this.parseKGML(text);
                }
                catch (e) {
                    return null;
                }
            });
        },
        parseReactomeJSON(data) {
            const rawNodes = data.nodes || data.physicalEntities || [];
            const rawEdges = data.edges || data.interactions || [];
            const nodes = rawNodes.map((n) => ({
                id: String(n.dbId || n.id || n.stId),
                name: n.displayName || n.name || String(n.dbId),
                type: this.mapReactomeClass(n.renderableClass || n.type),
                x: n.x || (n.minX + (n.maxX - n.minX) / 2) || 400,
                y: n.y || (n.minY + (n.maxY - n.minY) / 2) || 400,
                stId: n.stId,
                region: n.region || null
            }));
            const edges = rawEdges.map((e) => ({
                source: String(e.from || e.sourceId || (e.input && e.input[0])),
                target: String(e.to || e.targetId || (e.output && e.output[0])),
                type: e.renderableClass || 'reaction'
            })).filter((e) => e.source && e.target);
            return { nodes, edges };
        },
        mapReactomeClass(rc) {
            if (!rc)
                return 'compound';
            const map = {
                'Protein': 'gene',
                'Complex': 'map',
                'Chemical': 'compound',
                'Reaction': 'reaction',
                'Pathway': 'map',
                'RNA': 'gene'
            };
            return map[rc] || 'compound';
        },
        parseKGML(xmlText) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            const nodes = [];
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
            const edges = [];
            const relations = xmlDoc.getElementsByTagName("relation");
            for (let i = 0; i < relations.length; i++) {
                const rel = relations[i];
                edges.push({ source: rel.getAttribute("entry1"), target: rel.getAttribute("entry2") });
            }
            return { nodes, edges };
        }
    }
};
window.GreenhouseModelsUtil = GreenhouseModelsUtil;
window.GreenhouseBioStatus = {
    stress: { load: 0, hpa: 0, autonomic: 0 },
    inflammation: { tone: 0, bbb: 1, microglia: 0 },
    sync(model, stats) {
        this[model] = Object.assign(Object.assign({}, this[model]), stats);
        window.dispatchEvent(new CustomEvent('greenhouseBioUpdate', { detail: { model, stats } }));
    }
};

})();

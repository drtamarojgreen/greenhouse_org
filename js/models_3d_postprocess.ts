/// <reference path="types/globals.d.ts" />

interface TAAConfig {
    enabled: boolean;
    jitterScale?: number;
}

interface BloomConfig {
    enabled: boolean;
    radius: number;
    threshold: number;
    intensity: number;
}

interface BackgroundConfig {
    top: string;
    bottom: string;
    showGrid?: boolean;
}

interface PostProcessConfig {
    taa?: TAAConfig;
    bloom?: BloomConfig;
    backgrounds: Record<string, BackgroundConfig> & { neutral: BackgroundConfig };
}

const GreenhousePostProcessor = {
    canvas: null as HTMLCanvasElement | null,
    ctx: null as CanvasRenderingContext2D | null,
    _accumulationCanvas: null as HTMLCanvasElement | null,
    _accumulationCtx: null as CanvasRenderingContext2D | null,
    _bloomCanvas: null as HTMLCanvasElement | null,
    _jitterX: 0,
    _jitterY: 0,
    _frameIndex: 0,

    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;

        this._accumulationCanvas = document.createElement('canvas');
        this._accumulationCanvas.width = canvas.width;
        this._accumulationCanvas.height = canvas.height;
        const accContext = this._accumulationCanvas.getContext('2d');
        if (!accContext) throw new Error("Could not get 2D context for accumulation canvas");
        this._accumulationCtx = accContext;
        console.log('PostProcessor: Initialized');
    },

    prepareFrame(config: PostProcessConfig): { x: number; y: number } {
        if (config.taa && config.taa.enabled) {
            this._frameIndex++;
            const scale = config.taa.jitterScale || 0.5;
            this._jitterX = (Math.random() - 0.5) * scale;
            this._jitterY = (Math.random() - 0.5) * scale;
            return { x: this._jitterX, y: this._jitterY };
        }
        return { x: 0, y: 0 };
    },

    applyEffects(config: PostProcessConfig, camera: any): void {
        if (!config) return;

        if (config.bloom && config.bloom.enabled) {
            this._applyBloom(config.bloom);
        }

        if (config.taa && config.taa.enabled) {
            this._applyTAA(config.taa);
        }
    },

    _applyTAA(taa: TAAConfig): void {
        if (!this.canvas || this.canvas.width <= 0 || this.canvas.height <= 0) return;
        if (!this._accumulationCanvas || this._accumulationCanvas.width <= 0 || this._accumulationCanvas.height <= 0) return;

        const ctx = this.ctx;
        const accCtx = this._accumulationCtx;
        if (!ctx || !accCtx) return;

        accCtx.globalAlpha = 0.1;
        accCtx.drawImage(this.canvas, 0, 0);

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(this._accumulationCanvas, 0, 0);
        ctx.restore();
    },

    _applyBloom(bloom: BloomConfig): void {
        if (!this.canvas || this.canvas.width <= 0 || this.canvas.height <= 0) return;
        const ctx = this.ctx;
        if (!ctx) return;

        // Create temporary bloom buffer if needed
        if (!this._bloomCanvas) {
            this._bloomCanvas = document.createElement('canvas');
        }
        if (this._bloomCanvas.width !== this.canvas.width || this._bloomCanvas.height !== this.canvas.height) {
            this._bloomCanvas.width = this.canvas.width;
            this._bloomCanvas.height = this.canvas.height;
        }

        if (this._bloomCanvas.width <= 0 || this._bloomCanvas.height <= 0) return;
        const bCtx = this._bloomCanvas.getContext('2d');
        if (!bCtx) return;

        // Draw original to bloom buffer with filter
        bCtx.clearRect(0, 0, this._bloomCanvas.width, this._bloomCanvas.height);
        bCtx.save();
        bCtx.filter = `blur(${bloom.radius}px) brightness(${1 / bloom.threshold})`;
        bCtx.drawImage(this.canvas, 0, 0);
        bCtx.restore();

        // Blend bloom buffer back to main
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = bloom.intensity;
        ctx.drawImage(this._bloomCanvas, 0, 0);
        ctx.restore();
    },

    drawBackground(type: string, config: PostProcessConfig): void {
        const ctx = this.ctx;
        if (!ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const bg = config.backgrounds[type] || config.backgrounds.neutral;
        if (!bg) return;

        ctx.save();
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, bg.top);
        grad.addColorStop(1, bg.bottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        if (bg.showGrid) {
            this._drawGrid(ctx, w, h);
        }
        ctx.restore();
    },

    _drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number): void {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const step = 50;
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
            ctx.moveTo(x, 0); ctx.lineTo(x, h);
        }
        for (let y = 0; y <= h; y += step) {
            ctx.moveTo(0, y); ctx.lineTo(w, y);
        }
        ctx.stroke();
    }
};

(window as any).GreenhousePostProcessor = GreenhousePostProcessor;

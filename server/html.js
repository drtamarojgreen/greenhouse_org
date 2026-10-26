'use strict';

const ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

class SafeHtml {
    constructor(value) {
        this.value = value;
    }

    toString() {
        return this.value;
    }
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, ch => ESCAPES[ch]);
}

function raw(value) {
    return new SafeHtml(value === null || value === undefined ? '' : String(value));
}

function render(value) {
    if (value === null || value === undefined || value === false) return '';
    if (value instanceof SafeHtml) return value.value;
    if (Array.isArray(value)) return value.map(render).join('');
    return escapeHtml(value);
}

function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) {
        out += render(values[i]) + strings[i + 1];
    }
    return new SafeHtml(out);
}

function safeUrl(value, fallback = '#') {
    if (typeof value !== 'string' || value.trim() === '') return fallback;
    const url = value.trim();
    if (/^(https?:|mailto:|\/|#)/i.test(url)) return url;
    if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(url)) return url;
    return fallback;
}

function serializeForScript(value) {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

module.exports = { html, raw, escapeHtml, safeUrl, serializeForScript, SafeHtml };

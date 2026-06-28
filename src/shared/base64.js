const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function atobPolyfill(input) {
    let str = String(input).replace(/[=]+$/, '');
    if (str.length % 4 === 1) return '';

    let output = '';
    for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
        buffer = CHARS.indexOf(buffer);
    }
    return output;
}

export function decodeBase64(input) {
    if (typeof atob === 'function') {
        try {
            return atob(input);
        } catch {
            return atobPolyfill(input);
        }
    }
    return atobPolyfill(input);
}

export function decodeBase64Bytes(input) {
    const decoded = decodeBase64(input);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
}

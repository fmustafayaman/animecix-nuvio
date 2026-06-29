import { DEFAULT_HEADERS } from './constants.js';
import { getTmdbApiKey } from '../shared/tmdb.js';

// Nuvio'nun JS runtime'ı tek instance; timeout'suz bir fetch upstream takılırsa
// getStreams sonsuza dek askıda kalır ve tüm provider'ı kilitler (uygulamayı
// aç-kapa gerektirir). AbortController bu runtime'da güvenilir değil, bu yüzden
// Promise.race + setTimeout ile her isteğin mutlaka sonuçlanmasını garanti ediyoruz.
const DEFAULT_TIMEOUT_MS = 15000;

export function withTimeout(promise, ms = DEFAULT_TIMEOUT_MS, label = '') {
    // Nuvio plugin sandbox'ında setTimeout her zaman tanımlı değil (sadece fetch
    // ve console garanti). Yoksa timeout'suz devam et; aksi halde withTimeout'un
    // kendisi ReferenceError fırlatıp TÜM provider'ları çökertir.
    if (typeof setTimeout !== 'function') {
        return Promise.resolve(promise);
    }
    let timer = null;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error(`Timeout after ${ms}ms${label ? ` (${label})` : ''}`));
        }, ms);
    });
    return Promise.race([promise, timeout]).then(
        value => { if (timer) clearTimeout(timer); return value; },
        error => { if (timer) clearTimeout(timer); throw error; }
    );
}

export async function fetchJson(url, options = {}) {
    const { timeout = DEFAULT_TIMEOUT_MS, ...rest } = options;
    return await withTimeout((async () => {
        const response = await fetch(url, {
            headers: {
                ...DEFAULT_HEADERS,
                ...rest.headers
            },
            ...rest
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} on ${url}`);
        }

        return await response.json();
    })(), timeout, url);
}

export async function fetchWithRedirect(url, options = {}) {
    const { timeout = DEFAULT_TIMEOUT_MS } = options;
    return await withTimeout((async () => {
        const response = await fetch(url, {
            headers: DEFAULT_HEADERS,
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} on ${url}`);
        }

        return response.url;
    })(), timeout, url);
}

export async function getTmdbInfo(tmdbId, mediaType) {
    const apiKey = getTmdbApiKey();
    if (!apiKey) return { title: '', originalTitle: '' };

    try {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${apiKey}`;
        const data = await fetchJson(url);
        return {
            title: data.name || data.title || data.original_title || '',
            originalTitle: data.original_title || data.original_name || ''
        };
    } catch {
        return { title: '', originalTitle: '' };
    }
}

export async function getImdbId(tmdbId, mediaType) {
    const apiKey = getTmdbApiKey();
    if (!apiKey) return null;

    try {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const url = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${apiKey}`;
        const data = await fetchJson(url);
        return data.imdb_id || null;
    } catch {
        return null;
    }
}

export async function resolveEpisodeMapping(imdbId, season, episode) {
    try {
        // HuggingFace Space boştayken uykuda olabilir; opsiyonel bir iyileştirme
        // olduğu için kısa timeout veriyoruz ki oynatmayı geciktirmesin/kilitlemesin.
        const url = `https://id-mapping-api-malid.hf.space/api/resolve?id=${imdbId}&s=${season}&e=${episode}`;
        const data = await fetchJson(url, { timeout: 6000 });
        if (data.error) return null;
        return data;
    } catch {
        return null;
    }
}

export function slugifyQuery(title) {
    return (title || '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, '');
}

export function parseEpisodeNumber(name, fallback) {
    const patterns = [
        /(?:bölüm|episode|ep)\s*(\d+)/i,
        /(\d+)\.\s*(?:bölüm|episode)/i,
        /^(\d+)$/
    ];

    for (const pattern of patterns) {
        const match = (name || '').match(pattern);
        if (match) return parseInt(match[1], 10);
    }

    return fallback;
}

// Hermes'te String.prototype.normalize güvenilir değil; Türkçe karakterleri
// elle ASCII'ye katlayarak normalize gereksinimini ortadan kaldırıyoruz.
const TR_ASCII_MAP = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u',
    'â': 'a', 'Â': 'a', 'î': 'i', 'Î': 'i', 'û': 'u', 'Û': 'u'
};

export function normalizeTitle(value) {
    return String(value || '')
        .replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, c => TR_ASCII_MAP[c] || c)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

export function titlesMatch(tmdbTitles, animecixTitles) {
    const left = tmdbTitles.map(normalizeTitle).filter(t => t.length >= 3);
    const right = animecixTitles.map(normalizeTitle).filter(t => t.length >= 3);

    for (const a of left) {
        for (const b of right) {
            if (a === b) return true;
            if (a.length >= 6 && b.length >= 6 && (a.includes(b) || b.includes(a))) {
                return true;
            }
        }
    }

    return false;
}

export function qualitySortKey(quality) {
    const num = parseInt(String(quality || '').replace(/\D/g, ''), 10);
    return Number.isFinite(num) ? -num : 0;
}

export function formatSize(bytes) {
    if (!bytes || !Number.isFinite(bytes)) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
}

function unescapeRscChunk(chunk) {
    return String(chunk || '')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        );
}

export function parseRscPayload(html) {
    const chunks = [];
    const re = /self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)/g;
    let match;
    while ((match = re.exec(html)) !== null) {
        chunks.push(unescapeRscChunk(match[1]));
    }
    return chunks.join('');
}

export function parseTmdbId(payload) {
    const match = /"tmdb_id":(?:"(\d+)"|(\d+))/.exec(payload || '');
    if (!match) return null;
    return match[1] || match[2];
}

export function parseMovieParts(payload) {
    const match = /"parts":(\[[^\]]*\])/.exec(payload || '');
    if (!match) return [];

    try {
        const parts = JSON.parse(match[1]);
        return (parts || [])
            .filter(p => p && p.url && /vidlop\.com\/video\//i.test(p.url))
            .map(p => ({
                title: String(p.title || 'Tek Part').trim(),
                url: String(p.url).replace(/\\\//g, '/'),
                language: String(p.language || 'Türkçe').trim(),
                quality: String(p.quality || 'HD').trim()
            }));
    } catch {
        const parts = [];
        const re = /"url":"(https:\/\/vidlop\.com\/video\/[^"]+)","language":"([^"]*)"/g;
        let m;
        while ((m = re.exec(payload)) !== null) {
            parts.push({
                title: 'Tek Part',
                url: m[1].replace(/\\\//g, '/'),
                language: m[2] || 'Türkçe',
                quality: 'HD'
            });
        }
        return parts;
    }
}

export function parseEpisodeEmbeds(payload) {
    const urls = [];
    for (const key of ['embed_player_url_1', 'embed_player_url_2']) {
        const match = new RegExp(`"${key}":"(https:\\\\/\\\\/vidlop\\.com\\\\/video\\\\/[^"]+)"`).exec(payload || '');
        if (match) {
            urls.push(match[1].replace(/\\\//g, '/'));
            continue;
        }
        const plain = new RegExp(`"${key}":"(https://vidlop\\.com/video/[^"]+)"`).exec(payload || '');
        if (plain) urls.push(plain[1]);
    }
    return urls;
}

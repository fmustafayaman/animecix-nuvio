import { getTmdbInfo, getImdbId, resolveEpisodeMapping } from './utils.js';
import { findByTmdbId, getMovieEpisodeUrl, getEpisodeVideoUrl, getEpisodes, findEpisode } from './episodes.js';
import { extractStreams } from './extractor.js';

async function getStreams(tmdbId, mediaType = 'tv', season = 1, episode = 1) {
    try {
        console.log(`[Animecix] getStreams tmdb=${tmdbId} type=${mediaType} S${season}E${episode}`);

        const { title, originalTitle } = await getTmdbInfo(tmdbId, mediaType);
        if (!title && !originalTitle) return [];

        const match = await findByTmdbId(tmdbId, title, originalTitle, mediaType);
        if (!match) return [];

        const animeId = match.id;
        const animeTitle = match.name || title;

        if (mediaType === 'movie') {
            const episodePath = await getMovieEpisodeUrl(animeId);
            if (!episodePath) return [];
            return await extractStreams(episodePath, animeTitle, 'Film');
        }

        const s = season || 1;
        const e = episode || 1;
        let mappedEpisode = e;

        const imdbId = await getImdbId(tmdbId, mediaType);
        if (imdbId) {
            const mapping = await resolveEpisodeMapping(imdbId, s, e);
            if (mapping?.mal_episode) {
                mappedEpisode = mapping.mal_episode;
            }
        }

        // Hızlı yol: best-video doğrudan bölüm embed URL'si döndürür (~200ms).
        // Eski yol tüm sezon bölüm listesini çekiyordu (One Piece'te 1168 kayıt → yavaş/takılma).
        for (const epNum of [mappedEpisode, e]) {
            const episodePath = getEpisodeVideoUrl(animeId, s, epNum);
            const streams = await extractStreams(episodePath, animeTitle, `Bölüm ${e}`);
            if (streams.length) {
                console.log(`[Animecix] best-video S${s}E${epNum} → ${streams.length} stream`);
                return streams;
            }
        }

        // Yedek: tam bölüm listesinden ara (nadir edge case'ler)
        console.log('[Animecix] best-video başarısız, bölüm listesi deneniyor');
        const episodes = await getEpisodes(animeId, s);
        if (!episodes.length) return [];

        const target = findEpisode(episodes, s, e, mappedEpisode);
        if (!target?.url) return [];

        const episodeLabel = target.name || `Bölüm ${target.episodeNum || e}`;
        return await extractStreams(target.url, animeTitle, episodeLabel);
    } catch (err) {
        console.error('[Animecix] getStreams error:', err?.message || err);
        return [];
    }
}

module.exports = { getStreams };

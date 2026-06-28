import { getTmdbInfo, getImdbId, resolveEpisodeMapping } from './utils.js';
import { findByTmdbId, getMovieEpisodeUrl, getEpisodes, findEpisode } from './episodes.js';
import { extractStreams } from './extractor.js';

async function getStreams(tmdbId, mediaType = 'tv', season = 1, episode = 1) {
    try {
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

        const episodes = await getEpisodes(animeId, s);
        if (!episodes.length) return [];

        const target = findEpisode(episodes, s, e, mappedEpisode);
        if (!target?.url) return [];

        const episodeLabel = target.name || `Bölüm ${target.episodeNum || e}`;
        return await extractStreams(target.url, animeTitle, episodeLabel);
    } catch {
        return [];
    }
}

module.exports = { getStreams };

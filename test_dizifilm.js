/**
 * Dizifilm provider test scripti
 *
 * Usage:
 *   npm run build && node test_dizifilm.js 27205 movie
 *   node test_dizifilm.js 1396 tv 1 1   (Breaking Bad S1E1)
 */

const { getStreams, getSubtitles } = require('./providers/dizifilm.js');

const TMDB_ID = parseInt(process.argv[2] || '27205', 10);
const MEDIA_TYPE = process.argv[3] || 'movie';
const SEASON = parseInt(process.argv[4] || '1', 10);
const EPISODE = parseInt(process.argv[5] || '1', 10);

async function main() {
    console.log(`Testing Dizifilm: tmdb=${TMDB_ID} type=${MEDIA_TYPE} s=${SEASON} e=${EPISODE}\n`);

    const streams = await getStreams(TMDB_ID, MEDIA_TYPE, SEASON, EPISODE);

    if (!streams.length) {
        console.log('No streams found.');
        process.exit(1);
    }

    console.log(`Found ${streams.length} stream(s):\n`);
    for (const stream of streams) {
        console.log(`  [${stream.name}] ${stream.type}`);
        console.log(`  ${stream.url}`);
        if (stream.subtitles && stream.subtitles.length) {
            console.log(`  subtitles: ${stream.subtitles.map(s => s.label || s.name).join(', ')}`);
        }
        console.log('');
    }

    console.log('--- getSubtitles() ---');
    const subs = await getSubtitles(TMDB_ID, MEDIA_TYPE, SEASON, EPISODE);
    if (!subs.length) {
        console.log('No subtitles found.');
    } else {
        for (const sub of subs) {
            console.log(`  [${sub.label}] lang=${sub.lang} format=${sub.format}`);
            console.log(`  ${sub.url}`);
        }
    }
}

main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});

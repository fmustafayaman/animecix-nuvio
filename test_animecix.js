/**
 * Local test script for the Animecix provider.
 *
 * Usage:
 *   npm run build && node test_animecix.js
 *   node test_animecix.js 37854 tv 1 1   # One Piece S1E1
 */

const { getStreams } = require('./providers/animecix.js');

const TMDB_ID = parseInt(process.argv[2] || '37854', 10);
const MEDIA_TYPE = process.argv[3] || 'tv';
const SEASON = parseInt(process.argv[4] || '1', 10);
const EPISODE = parseInt(process.argv[5] || '1', 10);

async function main() {
    console.log(`Testing Animecix: tmdb=${TMDB_ID} type=${MEDIA_TYPE} S${SEASON}E${EPISODE}\n`);

    const streams = await getStreams(TMDB_ID, MEDIA_TYPE, SEASON, EPISODE);

    if (!streams.length) {
        console.log('No streams found.');
        process.exit(1);
    }

    console.log(`Found ${streams.length} stream(s):\n`);
    for (const stream of streams) {
        console.log(`  [${stream.quality}] ${stream.name}`);
        console.log(`  ${stream.url}`);
        console.log('');
    }
}

main().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});

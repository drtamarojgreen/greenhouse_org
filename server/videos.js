'use strict';

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function getYouTubeVideoId(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('youtu.be')) {
            return parsed.pathname.slice(1) || null;
        }
        if (parsed.pathname.includes('/shorts/')) {
            const parts = parsed.pathname.split('/');
            return parts[parts.length - 1] || null;
        }
        if (parsed.hostname.includes('youtube.com')) {
            return parsed.searchParams.get('v');
        }
    } catch (error) {
        const match = String(url).match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?/ ]{11})/);
        if (match) return match[1];
    }
    return null;
}

function processVideoFeed(feed) {
    return feed.map(video => {
        const videoId = getYouTubeVideoId(video.link);
        return {
            ...video,
            url: video.link,
            embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : video.link,
            embeddable: Boolean(videoId && YOUTUBE_ID_PATTERN.test(videoId))
        };
    });
}

module.exports = { getYouTubeVideoId, processVideoFeed };

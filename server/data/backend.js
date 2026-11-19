'use strict';

const fs = require('fs');
const path = require('path');
const { ENDPOINTS_DIR } = require('../content');

function readEndpoint(name, fallback) {
    const fullPath = path.resolve(ENDPOINTS_DIR, name);
    if (!fullPath.startsWith(ENDPOINTS_DIR + path.sep)) {
        throw new Error(`Invalid endpoint path: ${name}`);
    }
    try {
        return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            return fallback;
        }
        throw error;
    }
}

const booksPage = readEndpoint('books.json', {});
const newsPage = readEndpoint('news.json', {});
const inspirationPage = readEndpoint('inspiration.json', {});

module.exports = {
    books: Array.isArray(booksPage && booksPage.books) ? booksPage.books : [],
    news: Array.isArray(newsPage && newsPage.articles) ? newsPage.articles : [],
    quotes: Array.isArray(inspirationPage && inspirationPage.quotes) ? inspirationPage.quotes : [],
    videoFeed: [
        { id: 'video_rss_1', title: 'Latest Insights on Mental Well-being', description: 'A new video discussing mental health and practical tips for daily well-being.', link: 'https://www.youtube.com/watch?v=latest_video_id_1', published: '2023-11-01T12:00:00Z' },
        { id: 'video_rss_2', title: 'Quick Tips for Managing Stress', description: 'Short, practical strategies for managing stress in everyday life.', link: 'https://www.youtube.com/shorts/short_video_id_2', published: '2023-10-29T10:00:00Z' },
        { id: 'video_rss_3', title: 'Understanding Emotional Resilience', description: 'Explore what emotional resilience means and how to cultivate it.', link: 'https://www.youtube.com/watch?v=latest_video_id_3', published: '2023-10-25T09:00:00Z' }
    ],
    services: [
        { _id: 'svc_001', id: 'svc_001', name: 'Psychiatric Evaluation' },
        { _id: 'svc_002', id: 'svc_002', name: 'Medication Management' },
        { _id: 'svc_003', id: 'svc_003', name: 'Psychotherapy' }
    ]
};

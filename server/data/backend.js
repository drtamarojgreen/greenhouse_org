'use strict';

const fs = require('fs');
const path = require('path');

function readEndpoint(name, fallback) {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, '../../docs/endpoints', name), 'utf8'));
    } catch {
        return fallback;
    }
}

const booksPage = readEndpoint('books.json', {});
const newsPage = readEndpoint('news.json', {});
const inspirationPage = readEndpoint('inspiration.json', {});

module.exports = {
    books: booksPage.books || [],
    news: newsPage.articles || [],
    quotes: inspirationPage.quotes || [],
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

document.addEventListener('DOMContentLoaded', () => {
    fetchVideos();
});

async function fetchVideos() {
    try {
        const response = await fetch('/apps/wv/backend/getLatestVideosFromFeed.web.js');
        const videos = await response.json();
        displayVideos(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        document.getElementById('video-list').innerHTML = '<p>Failed to load videos. Please try again later.</p>';
    }
}

function displayVideos(videos) {
    const videoList = document.getElementById('video-list');
    videoList.innerHTML = ''; // Clear existing content

    if (videos && videos.length > 0) {
        videos.forEach(video => {
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';

            const videoTitle = document.createElement('h2');
            videoTitle.textContent = video.title;

            const videoPlayer = document.createElement('iframe');
            videoPlayer.src = video.embedUrl || video.url;
            videoPlayer.frameborder = "0";
            videoPlayer.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            videoPlayer.allowFullscreen = true;

            const videoDescription = document.createElement('p');
            videoDescription.textContent = video.description;

            videoCard.appendChild(videoTitle);
            videoCard.appendChild(videoPlayer);
            videoCard.appendChild(videoDescription);
            videoList.appendChild(videoCard);
        });
    } else {
        videoList.innerHTML = '<p>No videos available at the moment.</p>';
    }
}

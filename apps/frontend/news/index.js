const newsContainer = document.getElementById('news-container');

async function fetchAndDisplayNews() {
    try {
        const response = await fetch('/_api/getNews');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const newsData = data.items; // Assuming the backend returns { items: [...] }

        newsContainer.innerHTML = '';
        newsData.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.classList.add('article');
            articleElement.innerHTML = `
                <h2><a href="${article.url}">${article.title}</a></h2>
                <p>${article.source} - ${article.date}</p>
            `;
            newsContainer.appendChild(articleElement);
        });
    } catch (error) {
        console.error("Error fetching news:", error);
        newsContainer.innerHTML = '<p>Failed to load news. Please try again later.</p>';
    }
}

fetchAndDisplayNews();
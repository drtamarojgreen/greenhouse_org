const newsContainer = document.getElementById('news-container');

const newsData = [
    {
        title: "New Study on Mindfulness and Anxiety",
        source: "Journal of Mental Health",
        date: "2025-09-05",
        url: "#"
    },
    {
        title: "The Impact of Social Media on Teen Mental Health",
        source: "Mental Health Today",
        date: "2025-09-04",
        url: "#"
    },
    {
        title: "Research Finds Strong Link Between Exercise and Reduced Depression",
        source: "Science Daily",
        date: "2025-09-02",
        url: "#"
    }
];

function displayNews() {
    newsContainer.innerHTML = ''
    newsData.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.classList.add('article');
        articleElement.innerHTML = `
            <h2><a href="${article.url}">${article.title}</a></h2>
            <p>${article.source} - ${article.date}</p>
        `;
        newsContainer.appendChild(articleElement);
    });
}

displayNews();
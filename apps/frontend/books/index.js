const bookList = document.getElementById('book-list');

async function fetchAndDisplayBooks() {
    try {
        const response = await fetch('/_api/getBooks');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const bookData = data.items; // Assuming the backend returns { items: [...] }

        bookList.innerHTML = '';
        bookData.forEach(book => {
            const bookElement = document.createElement('div');
            bookElement.classList.add('book');
            bookElement.innerHTML = `
                <h3><a href="${book.url}">${book.title}</a></h3>
                <p>by ${book.author}</p>
            `;
            bookList.appendChild(bookElement);
        });
    } catch (error) {
        console.error("Error fetching books:", error);
        bookList.innerHTML = '<p>Failed to load books. Please try again later.</p>';
    }
}

fetchAndDisplayBooks();
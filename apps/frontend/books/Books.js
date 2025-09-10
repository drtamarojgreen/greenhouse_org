document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
});

async function fetchBooks() {
    try {
        const response = await fetch('/apps/wv/backend/getBooks.web.js');
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error('Error fetching books:', error);
        document.getElementById('book-list').innerHTML = '<p>Failed to load books. Please try again later.</p>';
    }
}

function displayBooks(books) {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = ''; // Clear existing content

    if (books && books.length > 0) {
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';

            const bookTitle = document.createElement('h2');
            bookTitle.textContent = book.title;

            const bookAuthor = document.createElement('p');
            bookAuthor.textContent = `Author: ${book.author}`;

            const bookDescription = document.createElement('p');
            bookDescription.textContent = book.description;

            bookCard.appendChild(bookTitle);
            bookCard.appendChild(bookAuthor);
            bookCard.appendChild(bookDescription);
            bookList.appendChild(bookCard);
        });
    } else {
        bookList.innerHTML = '<p>No books available at the moment.</p>';
    }
}

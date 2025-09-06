const bookList = document.getElementById('book-list');

const bookData = [
    {
        title: "The Body Keeps the Score: Brain, Mind, and Body in the Healing of Trauma",
        author: "Bessel van der Kolk M.D.",
        url: "#"
    },
    {
        title: "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        author: "James Clear",
        url: "#"
    },
    {
        title: "Daring Greatly: How the Courage to Be Vulnerable Transforms the Way We Live, Love, Parent, and Lead",
        author: "Brené Brown",
        url: "#"
    }
];

function displayBooks() {
    bookList.innerHTML = ''
    bookData.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.classList.add('book');
        bookElement.innerHTML = `
            <h3><a href="${book.url}">${book.title}</a></h3>
            <p>by ${book.author}</p>
        `;
        bookList.appendChild(bookElement);
    });
}

displayBooks();
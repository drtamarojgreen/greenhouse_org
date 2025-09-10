# Books

This directory contains the frontend code for the **Books** page of the main Greenhouse for Mental Health website:

👉 [https://greenhousementalhealth.org/books/](https://greenhousementalhealth.org/books/)

---

## How it works

The `Books.js` file contains Velo code that fetches a list of books from a static JSON file and displays them on the page in a repeater.

### Key Features:

-   **External Data Source**: The book list is fetched from a JSON file hosted on GitHub Pages:
    ```
    https://drtamarojgreen.github.io/greenhouse_org/endpoints/books/books.json
    ```
-   **Dynamic List of Books**: The fetched books are displayed in a repeater element on the page.

### Velo Elements Used:

-   `$w("#booksRepeater")`: A repeater to display the list of books.
-   `$item("#bookTitle")`: A text element inside the repeater for the book title.
-   `$item("#bookAuthor")`: A text element for the book author.
-   `$item("#bookDescription")`: A text element for the book description.

---

This approach makes the Books page lightweight and easy to update. New books can be added simply by updating the JSON file on GitHub.

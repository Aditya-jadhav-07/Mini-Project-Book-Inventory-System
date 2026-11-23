
const API_URL = "/api/books";

// HTML Elements
const booksTableBody = document.getElementById("booksTableBody");
const totalBooks = document.getElementById("totalBooks");
const totalCopies = document.getElementById("totalCopies");
const totalCategories = document.getElementById("totalCategories");

const bookModal = document.getElementById("bookModal");
const bookForm = document.getElementById("bookForm");
const modalTitle = document.getElementById("modalTitle");

const openAddModal = document.getElementById("openAddModal");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");

const searchInput = document.getElementById("searchInput");

let books = [];


// ==============================
// READ SERVER RESPONSE
// ==============================

async function readResponse(response) {
    const responseText = await response.text();

    let result = {};

    try {
        result = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
        console.error("Invalid server response:", responseText);

        throw new Error(
            `Server returned an invalid response (HTTP ${response.status}). Check Flask terminal.`
        );
    }

    if (!response.ok) {
        throw new Error(
            result.message || `Request failed (HTTP ${response.status}).`
        );
    }

    return result;
}


// ==============================
// LOAD BOOKS FROM DATABASE
// ==============================

async function loadBooks() {
    try {
        const response = await fetch(API_URL);

        books = await readResponse(response);

        if (!Array.isArray(books)) {
            throw new Error("Invalid books data received from server.");
        }

        displayBooks(books);
        updateDashboard();

    } catch (error) {
        console.error("Load books error:", error);

        booksTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:30px;">
                    Unable to load books. Please try again.
                </td>
            </tr>
        `;
    }
}


// ==============================
// DISPLAY BOOKS IN TABLE
// ==============================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function displayBooks(bookList) {

    if (bookList.length === 0) {
        booksTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:30px;">
                    No books found.
                </td>
            </tr>
        `;
        return;
    }

    booksTableBody.innerHTML = bookList.map(book => `
        <tr>
            <td>${escapeHTML(book.id)}</td>
            <td><strong>${escapeHTML(book.book_name)}</strong></td>
            <td>${escapeHTML(book.author)}</td>
            <td>${escapeHTML(book.category || "-")}</td>
            <td>₹${Number(book.price).toFixed(2)}</td>
            <td>${escapeHTML(book.quantity)}</td>

            <td>
                <button class="edit-btn" data-action="edit" data-id="${book.id}">
                    Edit
                </button>

                <button class="delete-btn" data-action="delete" data-id="${book.id}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}


// ==============================
// UPDATE DASHBOARD STATISTICS
// ==============================

function updateDashboard() {

    totalBooks.textContent = books.length;

    const copies = books.reduce(
        (total, book) => total + Number(book.quantity),
        0
    );

    totalCopies.textContent = copies;

    const categories = new Set(
        books
            .map(book => book.category?.trim().toLowerCase())
            .filter(Boolean)
    );

    totalCategories.textContent = categories.size;
}


// ==============================
// OPEN ADD BOOK MODAL
// ==============================

openAddModal.addEventListener("click", () => {

    bookForm.reset();

    document.getElementById("bookId").value = "";

    modalTitle.textContent = "Add New Book";

    document.getElementById("saveBookBtn").textContent = "Save Book";

    bookModal.classList.add("show");
});


// ==============================
// CLOSE MODAL
// ==============================

function hideModal() {
    bookModal.classList.remove("show");
}

closeModal.addEventListener("click", hideModal);
cancelModal.addEventListener("click", hideModal);

bookModal.addEventListener("click", event => {
    if (event.target === bookModal) {
        hideModal();
    }
});


// ==============================
// ADD OR UPDATE BOOK
// ==============================

bookForm.addEventListener("submit", async event => {

    event.preventDefault();

    const bookId = document.getElementById("bookId").value;

    const bookData = {
        book_name: document.getElementById("bookName").value.trim(),
        author: document.getElementById("author").value.trim(),
        category: document.getElementById("category").value.trim(),
        price: Number(document.getElementById("price").value),
        quantity: Number(document.getElementById("quantity").value)
    };

    // Basic validation
    if (
        !bookData.book_name ||
        !bookData.author ||
        !Number.isFinite(bookData.price) ||
        bookData.price < 0 ||
        !Number.isInteger(bookData.quantity) ||
        bookData.quantity < 0
    ) {
        alert("Please enter valid book details.");
        return;
    }

    try {

        const response = await fetch(
            bookId ? `${API_URL}/${bookId}` : API_URL,
            {
                method: bookId ? "PUT" : "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(bookData)
            }
        );

        const result = await readResponse(response);

        alert(result.message || "Book saved successfully!");

        hideModal();

        bookForm.reset();

        await loadBooks();

    } catch (error) {
        console.error("Save book error:", error);
        alert(error.message);
    }
});


// ==============================
// EDIT BOOK
// ==============================

function editBook(bookId) {

    const book = books.find(
        item => Number(item.id) === bookId
    );

    if (!book) {
        alert("Book not found.");
        return;
    }

    document.getElementById("bookId").value = book.id;
    document.getElementById("bookName").value = book.book_name;
    document.getElementById("author").value = book.author;
    document.getElementById("category").value = book.category || "";
    document.getElementById("price").value = book.price;
    document.getElementById("quantity").value = book.quantity;

    modalTitle.textContent = "Update Book";

    document.getElementById("saveBookBtn").textContent = "Update Book";

    bookModal.classList.add("show");
}


// ==============================
// DELETE BOOK
// ==============================

async function deleteBook(bookId) {

    const confirmation = confirm(
        "Are you sure you want to delete this book?"
    );

    if (!confirmation) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${bookId}`,
            {
                method: "DELETE"
            }
        );

        const result = await readResponse(response);

        alert(result.message || "Book deleted successfully!");

        await loadBooks();

    } catch (error) {
        console.error("Delete book error:", error);
        alert(error.message);
    }
}


// ==============================
// TABLE ACTIONS
// ==============================

booksTableBody.addEventListener("click", event => {

    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const bookId = Number(button.dataset.id);

    if (button.dataset.action === "edit") {
        editBook(bookId);
    }

    if (button.dataset.action === "delete") {
        deleteBook(bookId);
    }
});


// ==============================
// SEARCH BOOKS
// ==============================

searchInput.addEventListener("input", () => {

    const searchText = searchInput.value.toLowerCase().trim();

    const filteredBooks = books.filter(book =>

        String(book.id).includes(searchText) ||
        String(book.book_name || "").toLowerCase().includes(searchText) ||
        String(book.author || "").toLowerCase().includes(searchText) ||
        String(book.category || "").toLowerCase().includes(searchText)

    );

    displayBooks(filteredBooks);
});


// ==============================
// INITIALIZE APPLICATION
// ==============================

loadBooks();

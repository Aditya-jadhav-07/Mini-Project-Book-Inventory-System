from flask import send_from_directory
from flask import request, jsonify
from . import app
from .database import get_db_connection


# READ: Get all books
@app.route("/api/books", methods=["GET"])
def get_books():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM books")
    books = cursor.fetchall()

    cursor.close()
    connection.close()

    return jsonify(books)


# CREATE: Add a new book
@app.route("/api/books", methods=["POST"])
def add_book():
    data = request.get_json()

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
        INSERT INTO books (book_name, author, category, price, quantity)
        VALUES (%s, %s, %s, %s, %s)
    """

    values = (
        data["book_name"],
        data["author"],
        data.get("category"),
        data["price"],
        data["quantity"]
    )

    cursor.execute(query, values)
    connection.commit()

    cursor.close()
    connection.close()

    return jsonify({"message": "Book added successfully!"}), 201


# UPDATE: Update an existing book
@app.route("/api/books/<int:book_id>", methods=["PUT"])
def update_book(book_id):
    data = request.get_json()

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
        UPDATE books
        SET book_name = %s,
            author = %s,
            category = %s,
            price = %s,
            quantity = %s
        WHERE id = %s
    """

    values = (
        data["book_name"],
        data["author"],
        data.get("category"),
        data["price"],
        data["quantity"],
        book_id
    )

    cursor.execute(query, values)
    connection.commit()

    updated = cursor.rowcount

    cursor.close()
    connection.close()

    if updated == 0:
        return jsonify({"message": "Book not found!"}), 404

    return jsonify({"message": "Book updated successfully!"})



# DELETE: Delete a book
@app.route("/api/books/<int:book_id>", methods=["DELETE"])
def delete_book(book_id):
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("DELETE FROM books WHERE id = %s", (book_id,))
    connection.commit()

    deleted = cursor.rowcount

    cursor.close()
    connection.close()

    if deleted == 0:
        return jsonify({"message": "Book not found!"}), 404

    return jsonify({"message": "Book deleted successfully!"})


@app.route("/")
def home():
    return app.send_static_file("index.html")
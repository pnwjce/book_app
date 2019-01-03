CREATE TABLE books (
  author VARCHAR(255), 
  title VARCHAR(255),
  isbn VARCHAR(255), 
  image_url VARCHAR(500),
  description TEXT,
  bookshelf VARCHAR(255),
  id SERIAL PRIMARY KEY,
) 
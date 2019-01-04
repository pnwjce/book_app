'use strict';

//Application dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

//Load env vars
require('dotenv').config();

const PORT = process.env.PORT || 3000;

//Postgres
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

//App
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.set('view engine', 'ejs');
app.get('/', home);
app.post('/searches', search);
app.get('/books/:id', showBooks);
app.post('/books', saveBooks);

function home(req, res){
  let SQL = `SELECT * FROM books`;

  return client.query(SQL)
    .then(book => {
      console.log('book', book);
      res.render('pages/index', {book});
    })
    .catch(err => errorMessage(err, res));
}

function search(req, res){
  const searchStr = req.body.search[0];
  const searchType = req.body.search[1];
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if(searchType === 'title'){
    url += `+intitle:${searchStr}`;
  }else if(searchType === 'author'){
    url += `+inauthor:${searchStr}`;
  }
  return superagent.get(url)
    .then(result => {
      let books = result.body.items.map(book => new Book(book.volumeInfo));
      res.render('pages/searches/show', {books})
    })
    .catch(err => errorMessage(err, res));
}

function showBooks(req, res){
  let SQL = `SELECT * FROM books WHERE id+=$1;`;
  let values = [req.params.id];

  return client.query(SQL, values)
    .then(result => {
      const book = result.rows[0];
      return client.query('SELECT * FROM books')
        .then(booksFromBookshelf => {
          const bookshelf = booksFromBookshelf.rows;
          res.render('pages/books/show', {
            book: book,
            bookshelf: bookshelf,
          });
        })
        .catch(err => errorMessage(err, res));
    })
    .catch(err => errorMessage(err, res));
}

function saveBooks(req, res){
  let SQL = `INSERT INTO books(author, title, isbn, image, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)`;
  let values = [req.author, req.title, req.isbn, req.image, req.description, req.bookshelf];

  return client.query(SQL, values)
    .then(result => {
      let SQL = `SELECT id FROM books WHERE isbn=$3`;
      let values = [req.body.isbn];
      console.log('in the return client', result);
      //Store in our DB
      return client.query(SQL, values)
        .then(result => {
          res.redirect(`/books/${result.rows[0].id}`);
        })
        .catch(err => errorMessage(err, res));
    })
    .catch(err => errorMessage(err, res));
}

function DB(books){
  this.author = books.author;
  this.aut
}

function Book(book){
  this.title = book.title || 'This book does not have a title.';
  this.isbn = book.industryIdentifiers;
  this.author = book.authors ? book.authors.join(', ') : 'Unknown';
  this.image = book.imageLinks ? book.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpeg';
  this.description = book.description || 'No description provided.';
  console.log('book', book);
}

app.get('/*', function(req, res) {
  res.status(404).send('you are in the wrong place');
});

function errorMessage(res){
  res.status(500).render('pages/error');
} //created a function to handle the 500 errors but not sure what to do with it

app.listen(PORT, () => {
  console.log(`app is up on port : ${PORT}`);
});

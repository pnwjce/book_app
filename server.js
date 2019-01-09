'use strict';

//Application dependencies
const express = require('express');
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

//Routes
app.get('/', home);
app.get('/searches/new', searchHome);
app.post('/searches', search);
app.get('/books/:id', showBook);
app.post('/books', saveBooks);
app.put('/books/:id', updateBook);
app.delete('/books/:id', deleteBook);

//Handlers
function home(req, res){
  client.query(`SELECT * FROM books`)
    .then(book => {
      res.render('pages/index', {book});
    })
    .catch(err => errorMessage(err, res));
}

function searchHome(req, res){
  res.render('pages/searches/new');
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

function showBook(req, res){
  let SQL = `SELECT * FROM books WHERE id=$1;`;
  let values = [req.params.id];

  return client.query(SQL, values)
    .then(result => {
      const book = result.rows[0];
      return client.query('SELECT DISTINCT bookshelf FROM books;', {book});
    })
    .catch(err => errorMessage(err, res));
}

function saveBooks(req, res){
  let SQL = `INSERT INTO books(author, title, isbn, image, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)`;
  let savedBook = new BookshelfBook(req.body);
  let bookArray = Object.values(savedBook);
  bookArray.pop();
  console.log('bookArray before return', bookArray);



  // return client.query(SQL, values)
  // .then(result => {
  // console.log('result', result);
  // let SQL = `SELECT id FROM books WHERE id=$1`;
  // let values = [req.params.id];
  // console.log('values', values);
  // console.log('in the return client');
  //Store in our DB
  return client.query(SQL, bookArray)
    .then(() => res.redirect(`/`))
    .catch(err => errorMessage(err, res))
  // })
  // .catch(err => errorMessage(err, res));
}

console.log(saveBooks);

function updateBook(req, res){
  let SQL = `UPDATE books SET author=$1, title=$2, isbn=$3, image=$4, description=$5, bookshelf=$6 WHERE id=$1;`;
  let values = [req.body.author, req.body.title, req.body.isbn, req.body.image, req.body.description, req.body.bookshelf];

  console.log(`updating the book, ${req.params.id}, from DB`);

  return client.query(SQL, values)
    .then(() => res.redirect(`/`))
    .catch(err => errorMessage(err, res))
}

function deleteBook(req, res){
  console.log(`deleting the book, ${req.params.id}, from DB`);
  client.query(`DELETE FROM books WHERE id=$1`, [req.params.id])
    .then(result => {
      console.log(result);
      res.redirect('/');
    })
}

//Constructors
function Book(book){
  this.title = book.title || 'This book does not have a title.';
  this.isbn = book.industryIdentifiers;
  this.author = book.authors ? book.authors.join(', ') : 'Unknown';
  this.image = book.imageLinks ? book.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpeg';
  this.description = book.description || 'No description provided.';
  console.log('book', book);
}

function BookshelfBook(book){
  this.title = book.title;
  this.isbn = book.isbn;
  this.author = book.author;
  this.image = book.image;
  this.description = book.description;
  this.bookshelf = book.bookshelf || 'no bookshelf';
  this.id = book.id;
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

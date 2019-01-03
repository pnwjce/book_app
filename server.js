'use strict';

//Application dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

//Load env vars
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// //Postgres
// const client = new pg.Client(process.env.DATABASE_URL);
// client.connect();
// client.on('error', err => console.error(err));

//App
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.set('view engine', 'ejs');

app.get('/', home);

app.post('/searches', search);

function home(req, res){
  res.render('pages/index');
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

function Book(book){
  this.title = book.title || 'This book does not have a title.';
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

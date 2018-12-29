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
app.use(cors());

app.get('/*', function(req, res) {
  res.status(404).send('you are in the wrong place');
});

function errorMessage(res){
  res.status(500).send('something went wrong');
} //created a function to handle the 500 errors but not sure what to do with it

app.listen(PORT, () => {
  console.log(`app is up on port : ${PORT}`);
})
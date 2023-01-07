const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const db = require('../database/db.js');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.get('/', (req, res) => {
  console.log('MAIN PAGE HEARD')
  res.send(console.log('console.log'))
})

app.get('/products/', (req, res) => {
  let count = req.params.count;
  let page = req.params.page;

  find().limit(req.params.count)
    .then(response => {
    console.log(response)
  })
})

app.get('/products/:product_id', (req, res) => {
  console.log(req.params)
  db.Product.find({_id: req.params.product_id})
    .then(response => {
    res.send(response)
  })
})

app.get('/products/:product_id/styles', (req, res) => {
  db.Style.find({_id: req.params.product_id})
    .then(response => {
    res.send(response)
  })
})

app.get('/products/:product_id/related', (req, res) => {
  db.Related.find({_id: req.params.product_id})
    .then(response => {
    res.send(response)
  })
})





app.listen(PORT);
console.log(`Server listening at http://localhost:${PORT}`);

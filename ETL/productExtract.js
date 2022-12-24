const mongodb = require('mongodb').MongoClient;
const mongoose = require('mongoose')
const fs = require('fs')
const fastcsv = require('fast-csv')
const path = require('path');

const productSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    feature: String,
    value: String
  },
  { timestamps: true } // will automatically create and set `createdAt` and `updatedAt` timestamps
);

const Product = new mongoose.model('Product', productSchema);

const testPath = path.join(__dirname, '../data/product.csv');
let count = 0;
let lot = 0;
let url = 'mongodb://localhost:27017/';
let stream = fs.createReadStream(testPath)
let csvData = []
let csvStream = fastcsv
  .parse()
  .on('data', function (data) { // id,name,slogan,description,category,default_price
    // console.log('DATA1: ', data)

    if (count%10000 === 0) {
      lot++
      console.log('ON LINE: ', count)
    }
    csvData.push({
      lot: lot,
      _id: Number(data[0]),
      name: data[1],
      slogan: data[2],
      description: data[3],
      category: data[4],
      default_price: data[5],
      features: []
    })
    count++;
  })
  .on('end', function() {
    csvData.shift();

    mongodb.connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (err) throw err;
        client
          .db("sdc_products")
          .collection("products")
          .insertMany(csvData, (err, res) => {
            if (err) throw err;
            // console.log('INSERT MANY: ', csvData);
            client.close();
          });
      }
    );
  })
  stream.pipe(csvStream);

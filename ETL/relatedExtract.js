const mongodb = require('mongodb').MongoClient;
const mongoose = require('mongoose')
const fs = require('fs')
const fastcsv = require('fast-csv')
const path = require('path');



const testPath = path.join(__dirname, '../data/related.csv');
let count = 0;
let lot = 0;
let url = 'mongodb://localhost:27017/';
let stream = fs.createReadStream(testPath)
let csvData = {}
let csvStream = fastcsv
  .parse()
  .on('data', function (data) { // id,current_product_id,related_product_id

    if (count%10000 === 0) {
      console.log('ON LINE: ', count)
    }
    if (csvData[data[1]] === undefined) {
      csvData[data[1]] = [];
      csvData[data[1]].push(data[2])
    } else {
      csvData[data[1]].push(data[2])
    }

    count++;
  })
  .on('end', function() {
    let arr = []
    for (let key in csvData) {
      arr.push({ _id:Number(key), related: csvData[key] })
    }
    mongodb.connect(
      url,
      { useNewUrlParser: true, useUnifiedTopology: true },
      (err, client) => {
        if (err) throw err;
        client
          .db("sdc")
          .collection("related")
          .insertMany(arr, (err, res) => {
            if (err) throw err;
            // console.log('INSERT MANY: ', csvData);
            client.close();
          });
      }
    );
  })
  stream.pipe(csvStream);

const mongodb = require('mongodb').MongoClient;
const mongoose = require('mongoose')
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/sdc').catch(err => console.log(err));
const fs = require('fs')
const fastcsv = require('fast-csv')
const path = require('path');

const styleSchema = new mongoose.Schema(
  {
    _id: Number,
    results: Array
    // results: [{
    //   style_id: String,
    //   sale_price: String,
    //   original_price: String,
    //   default: Number,
    //   photos: Array,
    //   skus: Object
    // }]
  } // will automatically create and set `createdAt` and `updatedAt` timestamps
);

const Style = new mongoose.model('Style', styleSchema);

const stylesPath = path.join(__dirname, '../data/styles.csv');
const photosPath = path.join(__dirname, '../data/photos.csv');
const skusPath = path.join(__dirname, '../data/skus.csv');
let skip = 1900000
let maxRows = 100000
let count = skip;
let count_photos = 1;
let count_skus = 1;
let photo_end = 0;
let skus_end = 0;
let lot = 0;
let url = 'mongodb://localhost:27017/';
let stylesStream = fs.createReadStream(stylesPath)
let photosStream = fs.createReadStream(photosPath)
let skusStream = fs.createReadStream(skusPath)
let csvStylesObj = {}
let csvPhotosObj = {}
let csvSkusObj = {}
let csvData = []
let stylescsvStream = fastcsv
  .parse({headers: false, skipRows: skip, maxRows: maxRows})
  .on('data', function(data) {
    if (data[0] === 'id') return
    if (count%10000 === 0) {
      console.log('TEST styles count and skip', count, skip)
      lot++
      // console.log('STYLES DATA LINE: ', data[0])
    }

    if (csvStylesObj[data[1]] === undefined) {
      csvStylesObj[data[1]] = [];
    }

    csvStylesObj[data[1]].push({
      style_id: data[0],
      name: data[2],
      sale_price: data[3],
      original_price: data[4],
      default: Number(data[5]),
      photos: [],
      skus: {}
    })
    count++;

  })
  .on('end', function () { // id,productId,name,sale_price,original_price,default_style
    let lastStylesEntry = csvStylesObj[Object.keys(csvStylesObj)[Object.keys(csvStylesObj).length - 1]]
    console.log('STYLES END BEFORE LOOP')
    for (let key in csvStylesObj) {
      let prod = {
        _id: Number(key),
        results: csvStylesObj[key]
      }
      csvData.push(prod)

    }
    // console.log('STYLES END AFTER LOOP', csvData[0], csvData[csvData.length - 1])
  })

  let photoscsvStream = fastcsv
  .parse({quote: '', headers: false, skipRows: 5480000, maxRows: 600000})
  .on('data', function(data) {
    if (count_photos%100000 === 0) {console.log('PHOTOS ON COUNT: ', count_photos)}
    if (Number(data[1]) > skip & Number(data[1]) <= skip + maxRows) {

      if (csvPhotosObj[data[1]] === undefined) {
        csvPhotosObj[data[1]] = [];
      }

      csvPhotosObj[data[1]].push({
        id: data[0],
        url: data[2],
        thumbnail_url: data[3]
      })
    }
    count_photos++
  })
  .on('end', function () { // id,styleId,url,thumbnail_url
    console.log('PHOTOS END BEFORE LOOP')

    for (let key in csvPhotosObj) {
      if (Number(key)%10000 === 0) {console.log(key)}
      csvData.forEach(product => {

        product.results.forEach(style => {
          if (key === style.style_id) {
            style.photos = csvPhotosObj[key]
          }
        })
      })
      photo_end = Number(key)
    }
    let end = csvData[csvData.length - 1]
    if (photo_end === skus_end) {
      let firstEntry = csvData.shift()
      console.log('FIRST ENTRY: ', firstEntry)
      firstEntry.results.forEach((style, i) => {
      Style.findOneAndUpdate({_id: firstEntry._id}, {$push: {results: style}}, {upsert: true, new: true}).then(res => console.log('SUCCESFUL FOAUP: ', i, style.style_id))})
      mongodb.connect(
        url,
        { useNewUrlParser: true, useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          client
            .db("sdc")
            .collection("styles")
            .insertMany(csvData, (err, res) => {
              if (err) throw err;
              // console.log('INSERT MANY: ', csvData);
              client.close();
            });
        }
      );
    }
    // console.log('PHOTOS END AFTER LOOP ', csvData[0], csvData[csvData.length - 1])
    // console.log('PHOTOS AND SKUS OF LAST ENTRY: ', end.results[end.results.length - 1].photos, end.results[end.results.length - 1].skus)



  })

  let skuscsvStream = fastcsv
  .parse({headers: false, skipRows: 10900000, maxRows: 10000000}) // ensure this stream has more rows to parse than photos so this ends last otherwise data entry wont be complete
  .on('data', function(data) {

    if (Number(data[1]) > skip & Number(data[1]) <= skip + maxRows) {

      if (csvSkusObj[data[1]] === undefined) {
        csvSkusObj[data[1]] = {};
      }
      let sku_id = data[0]
      csvSkusObj[data[1]][sku_id] = {
        size: data[2],
        quantity: data[3]
      }
    }
    // count_skus++
  })
  .on('end', function () { // id,styleId,size,quantity
    console.log('SKUS END BEFORE LOOP')
    for (let key in csvSkusObj) {
      if (Number(key)%10000 === 0) {console.log(key)}
      csvData.forEach(product => {

        product.results.forEach(style => {
          if (key === style.style_id) {
            style.skus = csvSkusObj[key]

          }
        })
      })
      skus_end = Number(key)
    }
    let end = csvData[csvData.length - 1]
    console.log('SKUS END AFTER LOOP', end._id, end.results[0].photos[0], end.results[0].skus)

    if (photo_end === skus_end) {
      let firstEntry = csvData.shift()
      console.log('FIRST ENTRY: ', firstEntry)
      firstEntry.results.forEach((style, i) => {
      Style.findOneAndUpdate({_id: firstEntry._id}, {$push: {results: style}}, {upsert: true, new: true}).then(res => console.log('SUCCESFUL FOAUP: ', i, style.style_id))})
      mongodb.connect(
        url,
        { useNewUrlParser: true, useUnifiedTopology: true },
        (err, client) => {
          if (err) throw err;
          client
            .db("sdc")
            .collection("styles")
            .insertMany(csvData, (err, res) => {
              if (err) throw err;
              // console.log('INSERT MANY: ', csvData);
              client.close();
            });
        }
      );
    }

  })
  stylesStream.pipe(stylescsvStream);
  photosStream.pipe(photoscsvStream);
  skusStream.pipe(skuscsvStream)

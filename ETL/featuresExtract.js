const mongodb = require('mongodb').MongoClient;
const mongoose = require('mongoose')
const fs = require('fs')
const fastcsv = require('fast-csv')
const path = require('path');
mongoose.set('strictQuery', false);
mongoose.connect('mongodb://localhost:27017/sdc_products').catch(err => console.log(err));
// console.log(db)
const productSchema = new mongoose.Schema(
  {
    lot: Number,
    _id: Number,
    name: String,
    slogan: String,
    description: String,
    category: String,
    default_price: String,
    features: Array
  }
);// id,name,slogan,description,category,default_price




const Product = new mongoose.model('Product', productSchema);
// Product.find({}).then(res => {console.log('TEST: ', res)}).catch(err => console.log(err));
// Product.findOneAndUpdate({id: '20'}, {features: [{feature: 'apple', value: 'banana'}]}, {new: true})
//       .then(res => console.log('TEST', res))
const testPath = path.join(__dirname, '../data/features.csv');
let count = 0;
let url = 'mongodb://localhost:27017/';
let stream = fs.createReadStream(testPath)
let features_obj = {}
let csvStream = fastcsv
  .parse()
  .on('data', function (data) { // id,product_id,feature,value
    if (data[0] === 'id') return // skips headers
    if (count > 2000000 & count <= 2250000) {
      if (count%10000 === 0) {console.log('ON LINE: ', count)}
      let feat = {feature:data[2], value:data[3]}

      if (features_obj[data[1]] === undefined) {
        features_obj[data[1]] = [];
        features_obj[data[1]].push(feat);
      } else {
        features_obj[data[1]].push(feat);
      }
    }
    count++

  })
  .on('end', function() {
    let t1 = performance.now()

    for (var key in features_obj) {
      let lot = (Number(key) - Number(key)%10000)/10000
      let query = {_id:key}
      let update = {features: features_obj[key]}
      // console.log(query, update)
      if (Number(key)%1000 === 0) {console.log('ON ID: ', key)}
      Product.findOneAndUpdate(query, update,{new: true})
      .then(res => {
        let t2 = performance.now()
        if (res._id%10000 === 0) {
          console.log('Product ID: ', res._id, ((t2 - t1)/1000).toFixed(), 'seconds')
        }
      })
    }
  })
  stream.pipe(csvStream);


// console.log(csvStream)
const mongoose = require('mongoose');

const mongoDB = 'mongodb://localhost/sdc';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;

const productSchema = mongoose.Schema({
  _id: Number,
  name: String,
  slogan: String,
  description: String,
  category: String,
  default_price: Number,
  features: [
    {feature: String, value: String}
  ]

})

const styleSchema = mongoose.Schema({
  _id: Number,
  results: [
    {
      style_id: Number,
      name: String,
      original_price: String,
      sale_price: Boolean,
      photos: [
        {thumbnail_url: String, url: String}
      ],
      skus: {}
    }
  ]
},{ minimize: false })

const relatedSchema = mongoose.Schema({
  _id: Array

})

const Product = mongoose.model('Product', productSchema);
const Style = mongoose.model('Style', styleSchema);
const Related = mongoose.model('Related', relatedSchema);

module.exports.Product = Product;
module.exports.Style = Style;
module.exports.Related = Related
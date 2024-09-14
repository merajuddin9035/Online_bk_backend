const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  imgUrl: {
    type: String
  },
  hotel: {
    type: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBestDeal: {
    type: Boolean,
    default: false
  },
  rating: {
    averageRating: {
      type: Number,
      default: 0
    },
    numberOfRatings: {
      type: Number,
      default: 0
    }
  }
});

module.exports = mongoose.model('Product', productSchema);




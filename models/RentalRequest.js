const mongoose = require("mongoose");

const RentalRequestSchema = new mongoose.Schema({
  itemId: String,
  itemName: String,

  itemImage: String,
  price: String,

  ownerEmail: String,
  ownerName: String,

  renterEmail: String,
  renterName: String,

  pickupDate: String,
  returnDate: String,
  deliveryType: String,
  contact: String,
  notes: String,

    status: {
    type: String,
    default: "Pending"
  },

  canRate: {
    type: Boolean,
    default: false
  },

  rated: {
    type: Boolean,
    default: false
  },

  rating: {
    type: Number,
    default: 0
  },

  review: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("RentalRequest", RentalRequestSchema);

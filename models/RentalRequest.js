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
  }
}, { timestamps: true });

module.exports = mongoose.model("RentalRequest", RentalRequestSchema);

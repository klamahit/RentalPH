const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    price: String,
    deposit: String,
    delivery: String,
    location: String,
    contact: String,
    status: { type: String, default: "Available" },
    desc: String,
    image: String,
    ownerEmail: String,
    ownerName: String,
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);

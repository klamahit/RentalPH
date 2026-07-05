const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderEmail: String,
    senderName: String,
    receiverEmail: String,
    receiverName: String,
    text: String,
    readBy: [String],
    deleted: { type: Boolean, default: false },
    deletedFor: [String],
    edited: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);

require("dotenv").config();


const express = require("express");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");
const Item = require("./models/Item");
const RentalRequest = require("./models/RentalRequest");


connectDB();

const usersFile = path.join(__dirname, "database", "users.json");
const messagesFile = path.join(__dirname, "database", "messages.json");
const rentalsFile = path.join(__dirname, "database", "rentals.json");
const itemsFile = path.join(__dirname, "database", "items.json");

function readMessages() {
  if (!fs.existsSync(messagesFile)) return [];
  return JSON.parse(fs.readFileSync(messagesFile, "utf8"));
}

function saveMessages(messages) {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

function readUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, "utf8"));
}

function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function readRentals() {
  if (!fs.existsSync(rentalsFile)) return [];
  return JSON.parse(fs.readFileSync(rentalsFile, "utf8"));
}

function saveRentals(rentals) {
  fs.writeFileSync(rentalsFile, JSON.stringify(rentals, null, 2));
}

function readItems() {
  if (!fs.existsSync(itemsFile)) return [];
  return JSON.parse(fs.readFileSync(itemsFile, "utf8"));
}

function saveItems(items) {
  fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2));
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let onlineUsers = {};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, contact, password, role } = req.body;

    if (!name || !email || !contact || !password || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      contact,
      password: hashedPassword,
      role
    });

    res.json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Server error during signup." });
  }
});


app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    res.json({
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
});

app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error("Get items error:", err.message);
    res.status(500).json({ message: "Server error getting items." });
  }
});

app.post("/api/items", async (req, res) => {
  try {
    const item = await Item.create({
      ...req.body,
      status: "Available"
    });

    res.json({
      message: "Item saved successfully.",
      item
    });
  } catch (err) {
    console.error("Add item error:", err.message);
    res.status(500).json({
      message: "Error saving item."
    });
  }
});

app.put("/api/items/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "Item updated successfully.",
      item
    });
  } catch (err) {
    console.error("Update item error:", err.message);
    res.status(500).json({ message: "Error updating item." });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);

    res.json({
      message: "Item deleted successfully."
    });
  } catch (err) {
    console.error("Delete item error:", err.message);
    res.status(500).json({ message: "Error deleting item." });
  }
});


app.post("/api/save-approved-rental", (req, res) => {
  const rental = req.body;
  const rentals = readRentals();

  const exists = rentals.find(r => r.id === rental.id);

  if (!exists) {
    rentals.push({
      ...rental,
      reminderSent: false
    });
  }

  saveRentals(rentals);

  res.json({
    message: "Approved rental saved for reminder."
  });
});

app.get("/api/rental-requests", async (req, res) => {
  try {
    const requests = await RentalRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Get rental requests error:", err.message);
    res.status(500).json({ message: "Error getting rental requests." });
  }
});

app.post("/api/rental-requests", async (req, res) => {
  try {
    const request = await RentalRequest.create(req.body);
    res.json({ message: "Rental request sent.", request });
  } catch (err) {
    console.error("Create rental request error:", err.message);
    res.status(500).json({ message: "Error sending rental request." });
  }
});

app.put("/api/rental-requests/:id", async (req, res) => {
  try {

    // Update ang rental request
    const request = await RentalRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Kung approved, himuong Rented ang item
    if (request && req.body.status === "Approved") {
      await Item.findByIdAndUpdate(request.itemId, {
        status: "Rented"
      });
    }

    // Kung rejected, ibalik sa Available
    if (request && req.body.status === "Rejected") {
      await Item.findByIdAndUpdate(request.itemId, {
        status: "Available"
      });
    }

    res.json({
      message: "Rental request updated.",
      request
    });

  } catch (err) {
    console.error("Update rental request error:", err.message);
    res.status(500).json({
      message: "Error updating rental request."
    });
  }
});

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

socket.on("userOnline", (user) => {
  onlineUsers[user.email] = {
    name: user.name,
    socketId: socket.id
  };

  io.emit("onlineUsers", onlineUsers);
});

  Message.find().sort({ createdAt: 1 }).then(messages => {
  socket.emit("loadMessages", messages);
});

  socket.on("sendMessage", async (msg) => {
  try {
    const newMsg = await Message.create({
      senderEmail: msg.senderEmail,
      senderName: msg.senderName,
      receiverEmail: msg.receiverEmail,
      receiverName: msg.receiverName,
      text: msg.text,
      readBy: [msg.senderEmail],
      deleted: false,
      edited: false
    });

    io.emit("newMessage", newMsg);
  } catch (err) {
    console.error("Send message error:", err);
  }
});

  socket.on("markAsRead", async (data) => {
  try {
    await Message.updateMany(
      {
        $or: [
          { senderEmail: data.currentEmail, receiverEmail: data.otherEmail },
          { senderEmail: data.otherEmail, receiverEmail: data.currentEmail }
        ],
        readBy: { $ne: data.currentEmail }
      },
      {
        $push: { readBy: data.currentEmail }
      }
    );

    const messages = await Message.find().sort({ createdAt: 1 });
    io.emit("loadMessages", messages);
  } catch (err) {
    console.error("Mark as read error:", err);
  }
});

socket.on("typing", (data) => {
  io.emit("typing", data);
});

socket.on("stopTyping", (data) => {
  io.emit("stopTyping", data);
});

socket.on("disconnect", () => {
  for (let email in onlineUsers) {
    if (onlineUsers[email].socketId === socket.id) {
      delete onlineUsers[email];
    }
  }

  io.emit("onlineUsers", onlineUsers);
  console.log("User disconnected:", socket.id);
});

});

cron.schedule("0 8 * * *", async () => {
  const rentals = readRentals();
  const today = new Date();

  for (let rental of rentals) {
    if (rental.status !== "Approved") continue;
    if (rental.reminderSent) continue;

    const returnDate = new Date(rental.returnDate);
    const diffTime = returnDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 3) {
      const subject = `RentalPH Due Reminder: ${rental.itemName}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: rental.renterEmail,
        subject,
        text: `Hello ${rental.renterName},

This is a reminder that your rented item "${rental.itemName}" is due on ${rental.returnDate}.

Please return the item on time.

Thank you,
RentalPH`
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: rental.ownerEmail,
        subject,
        text: `Hello ${rental.ownerName},

This is a reminder that your item "${rental.itemName}" rented by ${rental.renterName} is due on ${rental.returnDate}.

Please coordinate with the renter.

Thank you,
RentalPH`
      });

      rental.reminderSent = true;
    }
  }

  saveRentals(rentals);
});

server.listen(3000, () => {
  console.log("RentalPH running at http://localhost:3000");
});

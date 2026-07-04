/* RentalPH fixed app script */
const socket = io();

let typingUsers = {};

socket.on("typing", (data) => {
  typingUsers[data.senderEmail] = data;

  if (activeChatEmail === data.senderEmail) {
    openConversation(activeChatEmail, false);
  }
});

socket.on("stopTyping", (data) => {
  delete typingUsers[data.senderEmail];

  if (activeChatEmail === data.senderEmail) {
    openConversation(activeChatEmail, false);
  }
});

socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

let liveMessages = [];
let onlineUsers = {};

socket.on("loadMessages", (messages) => {
  liveMessages = messages;

  if (activeChatEmail) {
    openConversation(activeChatEmail, false);
  } else if (document.getElementById("chatList")) {
    displayMessagesPanel();
  }
});

socket.on("onlineUsers", (users) => {
  onlineUsers = users;

  if (activeChatEmail) {
    openConversation(activeChatEmail, false);
  } else {
    displayMessagesPanel();
  }
});

socket.on("newMessage", (msg) => {
  liveMessages.push(msg);

  if (activeChatEmail) {
    openConversation(activeChatEmail);
  } else {
    displayMessagesPanel();
  }
});

const DEFAULT_ITEMS = [
  {
    id: "demo-toyota-vios",
    name: "Toyota Vios",
    category: "Vehicle",
    price: "₱1,500/day",
    deposit: "₱3,000",
    delivery: "Pickup or Delivery",
    location: "Dumaguete City",
    contact: "09123456789",
    status: "Available",
    desc: "Reliable car for daily rental.",
    owner: "Demo Owner",
    ownerEmail: "owner@rentalph.local",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600"
  }
];

let items = [];
let activeMessageIndex = null;

function getJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (err) {
    return fallback;
  }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentUser() {
  return getJSON("currentUser", null);
}


async function loadItemsFromDB() {
  try {
    const res = await fetch("/api/items");
    items = await res.json();
    displayItems(items);
    displayItemsHome();
  } catch (err) {
    console.error("Load items error:", err);
  }
}

function getItems() {
  return items;
}

function refreshItems() {
  return items;
}


function makeId(prefix = "id") {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRoleLabel(role) {
  return role === "owner" ? "Owner" : "Renter";
}

function filterItems() {
  const category = document.getElementById("filterCategory")?.value || "All";
  const list = items;
  displayItems(category === "All" ? list : list.filter(item => item.category === category));
}

function filterByLocation(location) {
  showPage("browse");
  const list = items;
  if (location === "All") return displayItems(list);
  displayItems(list.filter(item => (item.location || "").toLowerCase().includes(location.toLowerCase())));
}

function showCategory(category) {
  showPage("browse");
  const filterCategory = document.getElementById("filterCategory");
  if (filterCategory) filterCategory.value = category;
  filterItems();
}

function displayItems(list) {
  const itemsList = document.getElementById("itemsList");
  if (!itemsList) return;

  itemsList.innerHTML = "";

  if (!list.length) {
    itemsList.innerHTML = "<p>No rental items found.</p>";
    return;
  }

  list.forEach(item => {
    const safeItem = JSON.stringify(item).replaceAll("'", "&#039;");
    itemsList.innerHTML += `
      <div class="card">
        <img src="${item.image || 'https://via.placeholder.com/400x250?text=Rental+Item'}">
        <h3>${escapeHTML(item.name)}</h3>
        <p><b>Category:</b> ${escapeHTML(item.category)}</p>
        <p><b>Price:</b> ${escapeHTML(item.price)}</p>
        <p><b>Deposit:</b> ${escapeHTML(item.deposit || "N/A")}</p>
        <p><b>Delivery:</b> ${escapeHTML(item.delivery || "N/A")}</p>
        <p><b>Location:</b> ${escapeHTML(item.location)}</p>
        <p><b>Status:</b> <span style="color:${item.status === 'Rented' ? 'red' : 'green'};font-weight:bold;">${escapeHTML(item.status || "Available")}</span></p>
        <p>${escapeHTML(item.desc)}</p>
        ${item.status === "Rented" ? `
          <button disabled style="background:#999;color:white;cursor:not-allowed;">Rented</button>
        ` : `
          <button onclick='openItem(${safeItem})'>Rent Now</button>
        `}
      </div>
    `;
  });
}

function displayItemsHome() {
  const featured = document.getElementById("featuredRentals");
  if (!featured) return;

  featured.innerHTML = "";

  const uploadedItems = items.filter(item =>
    item.ownerEmail &&
    item.ownerEmail !== "owner@rentalph.local" &&
    item.status === "Available"
  );

  if (uploadedItems.length === 0) {
    featured.innerHTML =
      "<p>No featured rentals yet. Post your first rental item.</p>";
    return;
  }

  uploadedItems.forEach(item => {
    const safeItem = JSON.stringify(item).replaceAll("'", "&#039;");

    featured.innerHTML += `
      <div class="card">
        <div class="image-box">
          <img
            class="item-image"
            src="${item.image || 'https://via.placeholder.com/400x250?text=Rental+Item'}"
            alt="${escapeHTML(item.name)}">
        </div>

        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.category)}</p>
        <p>${escapeHTML(item.price)}</p>

        <button onclick='openItem(${safeItem})'>
          View Item
        </button>
      </div>
    `;
  });
}

const slides = [
  { title: "Vehicle Rentals", desc: "Rent cars, motorcycles, and bicycles near you.", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900" },
  { title: "Gadget Rentals", desc: "Need a projector, laptop, or camera? Rent today.", image: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=900" },
  { title: "Tool Rentals", desc: "Power tools and construction equipment available.", image: "https://images.unsplash.com/photo-1581147036324-c1c7f4f1d4d2?w=900" },
  { title: "Camping Rentals", desc: "Tents, chairs, tables, and outdoor gear.", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900" }
];
let currentSlide = 0;

function updateSlide() {
  const image = document.getElementById("slideImage");
  const title = document.getElementById("slideTitle");
  const desc = document.getElementById("slideDesc");
  if (!image || !title || !desc) return;
  image.src = slides[currentSlide].image;
  title.textContent = slides[currentSlide].title;
  desc.textContent = slides[currentSlide].desc;
}
function nextSlide() { currentSlide = (currentSlide + 1) % slides.length; updateSlide(); }
function prevSlide() { currentSlide = (currentSlide - 1 + slides.length) % slides.length; updateSlide(); }
setInterval(nextSlide, 4000);

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");

  localStorage.setItem("lastPage", pageId);

  const mainFooter = document.getElementById("mainFooter");
  const searchRow = document.querySelector(".search-row");
  const bannerTitle = document.querySelector(".top-banner h1");



  if (mainFooter) mainFooter.style.display = pageId === "home" ? "grid" : "none";

  if (pageId === "dashboard" || pageId === "settings") {
    if (searchRow) searchRow.style.display = "none";
    if (bannerTitle) bannerTitle.textContent = pageId === "dashboard" ? "DASHBOARD" : "SETTINGS";
    if (pageId === "dashboard") showDashboardPanel(localStorage.getItem("dashboardPanel") || "posted");
  } else {
    if (searchRow) searchRow.style.display = "grid";
    if (bannerTitle) bannerTitle.textContent = "NEW RENTALS, RENT NOW!";
  }
  

  updateAuthUI();
}

function resizeImage(file, maxWidth = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addItem(event) {
  event.preventDefault();
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please login first before posting an item.");
    showPage("login");
    return;
  }
  if (currentUser.role !== "owner") {
    alert("Only owner accounts can post rental items.");
    return;
  }

  const file = document.getElementById("itemImage").files[0];
  let imageData = "";
  try {
    imageData = file ? await resizeImage(file) : "";
  } catch (err) {
    alert("Image could not be processed. Try a smaller photo.");
    return;
  }

  const newItem = {
    id: makeId("item"),
    name: document.getElementById("itemName").value.trim(),
    category: document.getElementById("itemCategory").value,
    price: document.getElementById("itemPrice").value.trim(),
    deposit: document.getElementById("itemDeposit").value.trim(),
    delivery: document.getElementById("itemDelivery").value,
    location: document.getElementById("itemLocation").value,
    contact: document.getElementById("itemContact").value.trim(),
    desc: document.getElementById("itemDesc").value.trim(),
    status: "Available",
    owner: currentUser.name,
    ownerEmail: currentUser.email,
    image: imageData
  };

  fetch("/api/items", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(newItem)
})
.then(res => res.json())
.then(data => {
  alert(data.message || "Rental item posted successfully!");
  event.target.reset();
  location.reload();
})
.catch(err => {
  console.error(err);
  alert("Error saving item.");
});

}

function openItem(item, source = "") {
  localStorage.setItem("selectedItem", JSON.stringify(item));

  if (source === "posted") {
    localStorage.setItem("backTo", "posted");
  } else {
    localStorage.removeItem("backTo");
  }

  window.location.href = "item.html";
}

function openFeaturedItem(name) {
  const item = items.find(i => i.name === name);
  if (item) openItem(item);
}

function searchItems() {
  const keyword = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
  showPage("browse");
  const allItems = items;
  if (!keyword) return displayItems(allItems);
  displayItems(allItems.filter(item =>
    (item.name || "").toLowerCase().includes(keyword) ||
    (item.category || "").toLowerCase().includes(keyword) ||
    (item.location || "").toLowerCase().includes(keyword) ||
    (item.desc || "").toLowerCase().includes(keyword)
  ));
}

async function registerUser(event) {
  event.preventDefault();

const role = document.getElementById("signupRole").value;
const name = document.getElementById("signupName").value;
const email = document.getElementById("signupEmail").value;
const contact = document.getElementById("signupContact").value;
const password = document.getElementById("signupPassword").value;
const confirm = document.getElementById("signupConfirmPassword").value;

  if (password !== confirm) {
    alert("Passwords do not match!");
    return;
  }

  const res = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, contact, password, role })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    return;
  }

  alert("Account created successfully!");
  showPage("login");
}

async function loginUser(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(data.user));

  alert("Login successful!");
  showPage("dashboard");
  updateAuthUI();
}
const currentUser = getCurrentUser();

if (currentUser) {
    socket.emit("userOnline", currentUser);
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("dashboardPanel");
  alert("Logged out successfully!");
  updateAuthUI();
  showPage("home");
}

function toggleProfileMenu() {
  const menu = document.getElementById("profileDropdown");
  if (menu) menu.style.display = menu.style.display === "block" ? "none" : "block";
}

window.addEventListener("click", function(event) {
  if (!event.target.closest("#userMenu")) {
    const menu = document.getElementById("profileDropdown");
    if (menu) menu.style.display = "none";
  }
});

function updateAuthUI() {
  const currentUser = getCurrentUser();
  const signupCard = document.querySelector(".signup-card");
  const authButtons = document.getElementById("authButtons");
  const userMenu = document.getElementById("userMenu");
  const menuUserName = document.getElementById("menuUserName");

  if (currentUser) {
    if (authButtons) authButtons.style.display = "none";
    if (userMenu) userMenu.style.display = "block";
    if (menuUserName) menuUserName.innerText = currentUser.name;
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileContact = document.getElementById("profileContact");
    if (profileName) profileName.innerText = currentUser.name;
    if (profileEmail) profileEmail.innerText = currentUser.email;
    if (profileContact) profileContact.innerText = currentUser.contact;
    if (signupCard) signupCard.style.display = "none";
  } else {
    if (authButtons) authButtons.style.display = "block";
    if (userMenu) userMenu.style.display = "none";
    if (signupCard) signupCard.style.display = "block";
  }
}

function updateDashboardNav() {
  const currentUser = getCurrentUser();
  const nav = document.querySelector(".dashboard-bottom-nav");
  if (!nav) return;
  const isOwner = currentUser?.role === "owner";
  nav.innerHTML = `
    <button onclick="showPage('home')">🏠<br>Home</button>
    <button onclick="showDashboardPanel('${isOwner ? "posted" : "rents"}')">${isOwner ? "📦<br>Posted Rental" : "📦<br>My Rents"}</button>
    <button onclick="showDashboardPanel('messages')">💬<br>Messages</button>
    <button onclick="showDashboardPanel('requests')">${isOwner ? "📨<br>Rental Requests" : "📨<br>My Requests"}</button>
    <button onclick="showDashboardPanel('profile')">👤<br>Profile</button>
  `;
}

function showDashboardPanel(type) {
  console.log("showDashboardPanel called:", type);
  const panel = document.getElementById("dashboardContent");
  const currentUser = getCurrentUser();
  if (!panel) return;
  if (!currentUser) {
    panel.innerHTML = "<h2>Please login first.</h2>";
    return;
  }

  localStorage.setItem("dashboardPanel", type);
  updateDashboardNav();

  if (type === "posted") {
  const rentalItems = items;
  const myItems = rentalItems.filter(item => item.ownerEmail === currentUser.email);
  const activeItems = myItems.filter(item => item.status === "Rented").length;
  const availableItems = myItems.filter(item => item.status === "Available").length;

  panel.innerHTML = `
    <h2>📦 Welcome, ${escapeHTML(currentUser.name)} 👋</h2>

    <div class="dashboard-summary">
      <div class="summary-card">
        <span>📦</span>
        <p>Total Items</p>
        <h3>${myItems.length}</h3>
      </div>

      <div class="summary-card">
        <span>🟢</span>
        <p>Available</p>
        <h3>${availableItems}</h3>
      </div>

      <div class="summary-card">
        <span>🔴</span>
        <p>Rented</p>
        <h3>${activeItems}</h3>
      </div>

      <div class="summary-card">
        <span>💰</span>
        <p>Earnings</p>
        <h3>₱0</h3>
      </div>
    </div>

    <h2 class="dashboard-section-title">My Posted Rentals</h2>
    <div id="myPostedRentals"></div>
  `;

  displayMyPostedRentals();
  return;
}

  if (type === "rents") {
    panel.innerHTML = `<h2>📦 My Rents</h2><div id="myRents"></div>`;
    displayMyRents();
    return;
  }

  if (type === "requests") {
    panel.innerHTML = `<h2>${currentUser.role === "owner" ? "📨 Rental Requests" : "📨 My Requests"}</h2><div id="dashboardRequests"></div>`;
    displayRentalRequests();
    return;
  }

  if (type === "messages") {
    displayMessagesPanel();
    return;
  }


  if (type === "profile") {

    const ratingData = getOwnerRating(currentUser.email);

    panel.innerHTML = `
      <h2>👤 My Profile</h2>
      <div class="profile-card">
        <p><b>Name:</b> ${escapeHTML(currentUser.name)}</p>
        <p><b>Email:</b> ${escapeHTML(currentUser.email)}</p>
        <p><b>Contact:</b> ${escapeHTML(currentUser.contact)}</p>
        <p><b>Account Type:</b> ${getRoleLabel(currentUser.role)}</p>
        <p><b>Status:</b> ✅ Verified User</p>
        <p><b>Rating:</b> ⭐ ${ratingData.average} / 5</p>
<p><b>Total Reviews:</b> ${ratingData.count}</p>
        <br><button onclick="editProfile()">✏️ Edit Profile</button>
      </div>
    `;
  }
}

function displayMyPostedRentals() {
  const box = document.getElementById("myPostedRentals");
  const currentUser = getCurrentUser();
  if (!box) return;

  const rentalItems = items;
  const myItems = rentalItems.filter(item => item.ownerEmail === currentUser.email);

  if (!myItems.length) {
    box.innerHTML = "<p>No posted rentals yet.</p>";
    return;
  }

  box.innerHTML = "";
box.className = "posted-rentals-grid";

myItems.forEach(item => {

    const originalIndex = rentalItems.findIndex(r => r.id === item.id);
    const safeItem = JSON.stringify(item).replaceAll("'", "&#39;");

    box.innerHTML += `
        <div class="dashboard-card">

    <img src="${item.image || 'https://via.placeholder.com/400x250?text=Rental+Item'}">

    <div class="card-content">

        <h3>${escapeHTML(item.name)}</h3>

        <div class="price">${escapeHTML(item.price)}</div>

        <div class="card-info">
            📍 ${escapeHTML(item.location)}
        </div>

        <div class="card-info">
            📦 ${escapeHTML(item.category)}
        </div>

        <div class="status-badge ${item.status === 'Available' ? 'available' : 'rented'}">
            ${escapeHTML(item.status)}
        </div>

        <div class="card-stats">
            👁 0 Views
            &nbsp;&nbsp;
            ❤️ 0 Favorites
        </div>

        <div class="dashboard-actions">
            <button onclick='openItem(${safeItem}, "posted")'>👁</button>
            <button onclick="editRental('${item._id}')">✏️</button>
            <button onclick="deleteRental('${item._id}')">🗑</button>
        </div>

    </div>

</div>
    `;

});
}
function displayMyRents() {
  const box = document.getElementById("myRents");
  const currentUser = getCurrentUser();

  if (!box) return;

  const requests = getJSON("rentalRequests", []);

  const myRents = requests.filter(req =>
    req.renterEmail === currentUser.email &&
    (req.status === "Approved" || req.status === "Returned")
  );

  if (!myRents.length) {
    box.innerHTML = "<p>No rental history yet.</p>";
    return;
  }

  box.innerHTML = "";

  myRents.forEach(req => {

    let extraButton = "";

if (req.status === "Returned" && req.canRate && !req.rated) {
  extraButton = `
    <br><br>
    <button onclick="openRatingPopup('${req.id}')">⭐ Rate Item</button>
  `;
}

if (req.status === "Returned" && req.rated) {
  extraButton = `
    <br><br>
    <p><b>✅ Rated:</b> ${"⭐".repeat(req.rating || 5)}</p>
    <p>${escapeHTML(req.review || "")}</p>
  `;
}

    box.innerHTML += `
      <div class="request-card">
        <b>${escapeHTML(req.itemName)}</b>

        <p>
          ${escapeHTML(req.pickupDate)}
          →
          ${escapeHTML(req.returnDate)}
        </p>

        <p>
          <b>Status:</b>
          ${
            req.status === "Approved"
            ? "✅ Currently Rented"
            : "📦 Returned"
          }
        </p>

        <button onclick="viewRentedItem('${req.id}')">👁 View Item</button>

        ${extraButton}
      </div>
    `;
  });

}

function displayRentalRequests() {
  const box = document.getElementById("dashboardRequests");
  const currentUser = getCurrentUser();
  if (!box) return;
  const requests = getJSON("rentalRequests", []);

  const visible = currentUser.role === "owner"
    ? requests.filter(req => req.ownerEmail === currentUser.email)
    : requests.filter(req => req.renterEmail === currentUser.email);

  if (!visible.length) {
    box.innerHTML = currentUser.role === "owner" ? "<p>No rental requests yet.</p>" : "<p>No requests sent yet.</p>";
    return;
  }

  box.innerHTML = "";
  visible.forEach(req => {
    const realIndex = requests.findIndex(r => r.id === req.id);
    box.innerHTML += `
      <div class="request-card mini-item">
        <b>${escapeHTML(req.itemName)}</b>
        <p><b>Renter:</b> ${escapeHTML(req.renterName || "")}</p>
        <p><b>Date:</b> ${escapeHTML(req.pickupDate)} to ${escapeHTML(req.returnDate)}</p>
        <p><b>Delivery:</b> ${escapeHTML(req.deliveryType || "")}</p>
        <p><b>Notes:</b> ${escapeHTML(req.notes || "")}</p>
        <p>Status: <b>${escapeHTML(req.status)}</b></p>
        ${currentUser.role === "owner" && req.status === "Pending" ? `
          <button onclick="updateRequestStatus(${realIndex}, 'Approved')">Approve</button>
          <button onclick="updateRequestStatus(${realIndex}, 'Rejected')">Reject</button>
        ` : ""}
      </div>
    `;
  });
}

function updateRequestStatus(realIndex, status) {
  const requests = getJSON("rentalRequests", []);
  const currentUser = getCurrentUser();
  if (!requests[realIndex] || requests[realIndex].ownerEmail !== currentUser.email) return;

  requests[realIndex].status = status;

  if (status === "Approved") {
    const rentalItems = items;
    const itemIndex = rentalItems.findIndex(item => item.id === requests[realIndex].itemId || (item.name === requests[realIndex].itemName && item.ownerEmail === currentUser.email));
    if (itemIndex !== -1) {
      rentalItems[itemIndex].status = "Rented";
      setJSON("rentalItems", rentalItems);
      items = rentalItems;
    }
  }

  setJSON("rentalRequests", requests);
  fetch("/api/save-approved-rental", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requests[realIndex])
});
  displayRentalRequests();
  displayMyPostedRentals();
  displayItems(items);
}

async function deleteRental(id) {
  if (!confirm("Delete this rental item?")) return;

  try {
    const res = await fetch(`/api/items/${id}`, {
      method: "DELETE"
    });

    const data = await res.json();
    alert(data.message);

    await loadItemsFromDB();
    showDashboardPanel("posted");
  } catch (err) {
    console.error(err);
    alert("Delete failed.");
  }
}

function editRental(id) {
  const rentalItems = items;
  const item = rentalItems.find(i => i._id === id);
  const panel = document.getElementById("dashboardContent");
  if (!item || !panel) return;

  panel.innerHTML = `
    <h2>✏️ Edit Rental Item</h2>
    <div class="settings-card">
      <input id="editItemName" value="${escapeHTML(item.name)}" placeholder="Item Name">
      <select id="editItemCategory">
        ${["Tools", "Vehicle", "House / Room", "Equipment", "Gadgets", "Camping", "Medical", "Others"].map(cat => `<option ${item.category === cat ? "selected" : ""}>${cat}</option>`).join("")}
      </select>
      <input id="editItemPrice" value="${escapeHTML(item.price)}" placeholder="Rental Price">
      <input id="editItemDeposit" value="${escapeHTML(item.deposit)}" placeholder="Security Deposit">
      <select id="editItemDelivery">
        ${["Pickup Only", "Delivery Only", "Pickup or Delivery"].map(opt => `<option ${item.delivery === opt ? "selected" : ""}>${opt}</option>`).join("")}
      </select>
      <select id="editItemLocation">
        ${["Dumaguete City", "Valencia", "Sibulan", "Bacong", "Bayawan"].map(loc => `<option ${item.location === loc ? "selected" : ""}>${loc}</option>`).join("")}
      </select>
      <input id="editItemContact" value="${escapeHTML(item.contact)}" placeholder="Contact Number">
      <textarea id="editItemDesc" placeholder="Description">${escapeHTML(item.desc)}</textarea>
      <button onclick="saveRentalEdit('${id}')">Save Changes</button>
      <button onclick="showDashboardPanel('posted')">Cancel</button>
    </div>
  `;
}

async function saveRentalEdit(id) {
  try {
    const res = await fetch(`/api/items/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: document.getElementById("editItemName").value.trim(),
        category: document.getElementById("editItemCategory").value,
        price: document.getElementById("editItemPrice").value.trim(),
        deposit: document.getElementById("editItemDeposit").value.trim(),
        delivery: document.getElementById("editItemDelivery").value,
        location: document.getElementById("editItemLocation").value,
        contact: document.getElementById("editItemContact").value.trim(),
        desc: document.getElementById("editItemDesc").value.trim()
      })
    });

    const data = await res.json();
    alert(data.message);

    await loadItemsFromDB();
    showDashboardPanel("posted");
  } catch (err) {
    console.error(err);
    alert("Update failed.");
  }
}

function returnRental(index) {

  const rentalItems = items;
  if (!rentalItems[index]) return;

  // Available na usab ang item
  rentalItems[index].status = "Available";
  setJSON("rentalItems", rentalItems);
  items = rentalItems;

  // Update rental request
  let requests = getJSON("rentalRequests", []);

  const item = rentalItems[index];

  requests.forEach(req => {
    if (
      req.itemId === item.id &&
      req.status === "Approved"
    ) {
      req.status = "Returned";
      req.canRate = true;
    }
  });

  setJSON("rentalRequests", requests);

  alert("Item returned successfully!");

  showDashboardPanel("posted");
}

function openMyPostedItem(item) {
  openItem(item, "posted");
}

function requestRental(item) {
  openItem(item);
}

let activeChatEmail = null;

function getVisibleMessages() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  return liveMessages.filter(msg =>
    (msg.senderEmail || "").toLowerCase() === currentUser.email.toLowerCase() ||
    (msg.receiverEmail || "").toLowerCase() === currentUser.email.toLowerCase()
  );
}

function getConversations() {
  const currentUser = getCurrentUser();
  const visible = getVisibleMessages();
  const conversations = {};
  visible.sort((a,b)=>new Date(a.date)-new Date(b.date));

  visible.forEach(msg => {
    const otherEmail =
      msg.senderEmail === currentUser.email
        ? msg.receiverEmail
        : msg.senderEmail;

    const otherName =
      msg.senderEmail === currentUser.email
        ? msg.receiverName
        : msg.senderName;

    conversations[otherEmail] = {
      otherEmail,
      otherName,
      lastMessage: msg.text,
      date: msg.date || new Date().toISOString()
    };
  });

  return Object.values(conversations);
}

function displayMessagesPanel() {
  if (localStorage.getItem("dashboardPanel") !== "messages") return;

  const panel = document.getElementById("dashboardContent");
  if (!panel) return;

  const currentUser = getCurrentUser();
  const conversations = getConversations();

  conversations.sort((a, b) => new Date(b.date) - new Date(a.date));

  let html = `
    <h2>💬 Messages</h2>
    <p>Total conversations: ${conversations.length}</p>

    <div class="messenger-list">
  `;

  if (conversations.length === 0) {
    html += `<p>No messages yet.</p>`;
  }

  conversations.forEach(convo => {
    const unread = liveMessages.filter(msg =>
      msg.senderEmail === convo.otherEmail &&
      msg.receiverEmail === currentUser.email &&
      (!msg.readBy || !msg.readBy.includes(currentUser.email))
    ).length;

    const avatarLetter = (convo.otherName || "?").charAt(0).toUpperCase();

    html += `
      <div class="messenger-item" onclick="openConversation('${convo.otherEmail}')">
        <div class="messenger-avatar">${avatarLetter}</div>

        <div class="messenger-info">
          <h4>
            ${onlineUsers[convo.otherEmail] ? "🟢" : "⚪"}
            ${escapeHTML(convo.otherName)}
          </h4>
          <p>${escapeHTML(convo.lastMessage)}</p>
          <small>${escapeHTML(convo.date)}</small>
        </div>

        ${unread > 0 ? `<div class="unread-badge">${unread}</div>` : ""}
      </div>
    `;
  });

  html += `</div>`;
  panel.innerHTML = html;
}


function openConversation(otherEmail, markRead = true) {
  activeChatEmail = otherEmail;

  const panel = document.getElementById("dashboardContent");
  const currentUser = getCurrentUser();

  if (markRead) {
    socket.emit("markAsRead", {
      currentEmail: currentUser.email,
      otherEmail: otherEmail
    });
  }

  const conversation = liveMessages.filter(msg =>
    (msg.senderEmail === currentUser.email && msg.receiverEmail === otherEmail) ||
    (msg.senderEmail === otherEmail && msg.receiverEmail === currentUser.email)
  );

  const otherName =
    conversation[0].senderEmail === currentUser.email
      ? conversation[0].receiverName
      : conversation[0].senderName;

  let html = `
    <div class="chat-page">
      <div class="chat-top">
        <button onclick="activeChatEmail = null; displayMessagesPanel()">←</button>
        <div>
          <h2>${escapeHTML(otherName)}</h2>
          <span>
  ${
    typingUsers[otherEmail]
    ? "typing..."
    : onlineUsers[otherEmail] ? "🟢 Online" : "⚪ Offline"
  }
</span>
        </div>
      </div>

      <div id="chatMessagesBox" class="chat-body">
  `;

  conversation.forEach(msg => {
    const mine = msg.senderEmail === currentUser.email;

    html += `
      <div class="chat-bubble ${mine ? "my-message" : "other-message"}">
        <div>${escapeHTML(msg.text)}</div>
        <small>${escapeHTML(msg.date)}</small>
      </div>
    `;
  });

  html += `
      </div>

      <div class="chat-reply-bar">
        <input
          id="replyInput"
          placeholder="Type your message..."
          onkeydown="handleChatEnter(event)"
oninput="handleTyping()"
        >
        <button onclick="sendChatReply()">➤</button>
      </div>
    </div>
  `;

  panel.innerHTML = html;

  const chatBox = document.getElementById("chatMessagesBox");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function sendChatReply() {
  const input = document.getElementById("replyInput");
  const currentUser = getCurrentUser();

  if (!input || !activeChatEmail) return;

  const text = input.value.trim();
  if (!text) return;

  const conversation = liveMessages.find(msg =>
    msg.senderEmail === activeChatEmail || msg.receiverEmail === activeChatEmail
  );

  const receiverName =
    conversation.senderEmail === activeChatEmail
      ? conversation.senderName
      : conversation.receiverName;

  socket.emit("sendMessage", {
    senderEmail: currentUser.email,
    senderName: currentUser.name,
    receiverEmail: activeChatEmail,
    receiverName,
    text
  });

  input.value = "";
}

let typingTimer;

function handleTyping() {
  const currentUser = getCurrentUser();
  if (!currentUser || !activeChatEmail) return;

  socket.emit("typing", {
    senderEmail: currentUser.email,
    receiverEmail: activeChatEmail
  });

  clearTimeout(typingTimer);

  typingTimer = setTimeout(() => {
    socket.emit("stopTyping", {
      senderEmail: currentUser.email,
      receiverEmail: activeChatEmail
    });
  }, 1000);
}

function handleChatEnter(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendChatReply();
  }
}

function replyMessage(realIndex) {
  openConversation(realIndex);
}

function openMessageItem(msg) {
  const item = {
    id: msg.itemId,
    name: msg.itemName,
    image: msg.itemImage || "https://via.placeholder.com/600x400?text=Rental+Item",
    price: msg.price || "",
    location: msg.location || "",
    category: msg.category || "",
    deposit: msg.deposit || "",
    delivery: msg.delivery || "",
    contact: msg.contact || "",
    desc: msg.desc || "",
    status: msg.status || "Available",
    ownerEmail: msg.ownerEmail || ""
  };
  openItem(item);
}

function editProfile() {
  const currentUser = getCurrentUser();
  const panel = document.getElementById("dashboardContent");
  if (!currentUser || !panel) return;
  panel.innerHTML = `
    <h2>✏️ Edit Profile</h2>
    <div class="profile-card">
      <input id="profileEditName" value="${escapeHTML(currentUser.name)}" placeholder="Full Name">
      <input id="profileEditContact" value="${escapeHTML(currentUser.contact)}" placeholder="Contact Number">
      <button onclick="saveDashboardProfile()">Save Profile</button>
      <button onclick="showDashboardPanel('profile')">Cancel</button>
    </div>
  `;
}

function saveDashboardProfile() {
  const currentUser = getCurrentUser();
  const users = getJSON("rentalphUsers", []);
  currentUser.name = document.getElementById("profileEditName").value.trim();
  currentUser.contact = document.getElementById("profileEditContact").value.trim();
  const index = users.findIndex(u => u.email === currentUser.email);
  if (index !== -1) users[index] = currentUser;
  setJSON("currentUser", currentUser);
  setJSON("rentalphUsers", users);
  updateAuthUI();
  showDashboardPanel("profile");
}

function showSettings() { showPage("settings"); }

function showEditProfileForm() {
  const currentUser = getCurrentUser();
  const box = document.getElementById("settingsContent");
  if (!currentUser || !box) return;
  box.innerHTML = `
    <h3>✏️ Edit Profile</h3>
    <input id="editName" value="${escapeHTML(currentUser.name)}" placeholder="Full Name">
    <input id="editContact" value="${escapeHTML(currentUser.contact)}" placeholder="Contact Number">
    <button onclick="saveProfileForm()">Save Profile</button>
  `;
}

function saveProfileForm() {
  const currentUser = getCurrentUser();
  const users = getJSON("rentalphUsers", []);
  currentUser.name = document.getElementById("editName").value.trim();
  currentUser.contact = document.getElementById("editContact").value.trim();
  const index = users.findIndex(u => u.email === currentUser.email);
  if (index !== -1) users[index] = currentUser;
  setJSON("currentUser", currentUser);
  setJSON("rentalphUsers", users);
  updateAuthUI();
  alert("Profile updated successfully!");
}

function showChangePasswordForm() {
  const box = document.getElementById("settingsContent");
  if (!box) return;
  box.innerHTML = `
    <h3>🔒 Change Password</h3>
    <input id="oldPassword" type="password" placeholder="Current Password">
    <input id="newPassword" type="password" placeholder="New Password">
    <input id="confirmNewPassword" type="password" placeholder="Confirm New Password">
    <button onclick="saveNewPassword()">Update Password</button>
  `;
}

function saveNewPassword() {
  const currentUser = getCurrentUser();
  const users = getJSON("rentalphUsers", []);
  const oldPass = document.getElementById("oldPassword").value;
  const newPass = document.getElementById("newPassword").value;
  const confirmPass = document.getElementById("confirmNewPassword").value;
  if (oldPass !== currentUser.password) return alert("Current password is incorrect.");
  if (newPass !== confirmPass) return alert("New passwords do not match.");
  currentUser.password = newPass;
  const index = users.findIndex(u => u.email === currentUser.email);
  if (index !== -1) users[index] = currentUser;
  setJSON("currentUser", currentUser);
  setJSON("rentalphUsers", users);
  alert("Password updated successfully!");
}

window.onload = function() {
  updateAuthUI();
  updateDashboardNav();

  loadItemsFromDB();

  const currentUser = getCurrentUser();

  const forcedPanel = sessionStorage.getItem("forceDashboardPanel");
  if (forcedPanel && currentUser) {
    sessionStorage.removeItem("forceDashboardPanel");
    localStorage.removeItem("dashboardPanel");
    localStorage.removeItem("lastPage");

    showPage("dashboard");
    showDashboardPanel(forcedPanel);
    return;
  }

  const openPanel = localStorage.getItem("openDashboardPanel");
  if (openPanel && currentUser) {
    showPage("dashboard");
    showDashboardPanel(openPanel);
    localStorage.removeItem("openDashboardPanel");
    return;
  }

  const lastPage = localStorage.getItem("lastPage");
  if (currentUser && lastPage) showPage(lastPage);
};


function openFooterModal(type) {
  const modal = document.getElementById("footerModal");
  const content = document.getElementById("footerModalContent");
  if (!modal || !content) return;

  if (type === "about") {
    content.innerHTML = `
      <h2>ⓘ About RentalPH</h2>
      <p>RentalPH is an online rental marketplace where users can post and rent items safely and conveniently.</p>
      <p><b>Categories:</b> Vehicles, Houses, Tools, Gadgets, Camping, Medical Equipment, and more.</p>
      <p><b>Mission:</b> To provide a trusted and user-friendly rental platform.</p>
      <p><b>Vision:</b> To become one of the leading rental marketplaces in the Philippines.</p>
    `;
  }

  if (type === "follow") {
    content.innerHTML = `
      <h2>🌐 Follow Us</h2>
      <p>📘 Facebook: RentalPH Official</p>
      <p>📸 Instagram: @rentalph</p>
      <p>🎵 TikTok: @rentalph</p>
      <p>📧 Email: support@rentalph.com</p>
    `;
  }

  if (type === "copyright") {
    content.innerHTML = `
      <h2>© RentalPH 2026</h2>
      <p>Version 1.0.0</p>
      <p>Developed by Keith Amahit.</p>
      <p>All rights reserved.</p>
    `;
  }

  modal.style.display = "flex";
}

function closeFooterModal(event) {
    document.getElementById("footerModal").style.display = "none";
}

let currentRatingRequest = null;

function openRatingPopup(requestId) {

    currentRatingRequest = requestId;

    document.getElementById("ratingPopup").style.display = "flex";

}

function submitRating() {
  if (!currentRatingRequest) return;

  const rating = Number(document.getElementById("ratingStars").value);
  const review = document.getElementById("ratingReview").value.trim();

  let requests = getJSON("rentalRequests", []);

  requests = requests.map(req => {
    if (req.id === currentRatingRequest) {
      return {
        ...req,
        rated: true,
        rating: rating,
        review: review,
        canRate: false
      };
    }
    return req;
  });

  setJSON("rentalRequests", requests);

  closeRatingPopup();

  alert("Thank you for rating!");

  displayMyRents();
}

function closeRatingPopup() {
  document.getElementById("ratingPopup").style.display = "none";
  document.getElementById("ratingReview").value = "";
  document.getElementById("ratingStars").value = "5";
  currentRatingRequest = null;
}

function viewRentedItem(requestId) {
  const requests = getJSON("rentalRequests", []);
  const rentalItems = items;

  const req = requests.find(r => r.id === requestId);
  if (!req) return alert("Rental record not found.");

  const item = rentalItems.find(i => i.id === req.itemId);
  if (!item) return alert("Item not found.");

  localStorage.setItem("selectedItem", JSON.stringify(item));
  localStorage.setItem("backTo", "rents");

  window.location.href = "item.html";
}

function backToMyRents() {

    localStorage.removeItem("backTo");

    sessionStorage.setItem("forceDashboardPanel","rents");

    window.location.href="index.html";

}
function getOwnerRating(ownerEmail) {
  const requests = getJSON("rentalRequests", []);

  const reviews = requests.filter(req =>
    req.ownerEmail === ownerEmail &&
    req.rated &&
    req.rating
  );

  if (!reviews.length) {
    return { average: "No rating yet", count: 0 };
  }

  const total = reviews.reduce((sum, req) => sum + Number(req.rating), 0);
  const average = (total / reviews.length).toFixed(1);

  return {
    average,
    count: reviews.length
  };
}
function getOwnerRating(ownerEmail) {
  const requests = getJSON("rentalRequests", []);
  const email = (ownerEmail || "").trim().toLowerCase();

  const reviews = requests.filter(req =>
    (req.ownerEmail || "").trim().toLowerCase() === email &&
    req.rated &&
    req.rating
  );

  if (!reviews.length) {
    return {
      average: "No rating yet",
      count: 0,
      stars: "⭐"
    };
  }

  const total = reviews.reduce((sum, req) => sum + Number(req.rating), 0);
  const average = (total / reviews.length).toFixed(1);

  return {
    average,
    count: reviews.length,
    stars: "⭐".repeat(Math.round(average))
  };
}
async function loadItemsFromDB() {
  try {
    const res = await fetch("/api/items");
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Items API did not return array:", data);
      items = [];
      return;
    }

    items = data;
    displayItems(items);
    displayItemsHome();
  } catch (err) {
    console.error("Load items error:", err);
    items = [];
  }
}
// 📘 Mock Salesforce Contact API Server
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔧 Mock data
let contacts = [
  { Id: "001", FirstName: "John", LastName: "Doe", Email: "john@example.com" },
  { Id: "002", FirstName: "Jane", LastName: "Smith", Email: "jane@example.com" },
  { Id: "003", FirstName: "Sam", LastName: "Wilson", Email: "sam@example.com" }
];

// ➕ Add contact
app.post("/add-contact", (req, res) => {
  const { FirstName, LastName, Email } = req.body;
  console.log("➕ Add contact request received:", req.body);

  if (!FirstName || !LastName || !Email) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ error: "FirstName, LastName, and Email are required." });
  }

  const newId = (Math.floor(Math.random() * 10000) + 1000).toString();
  const newContact = { Id: newId, FirstName, LastName, Email };
  contacts.push(newContact);

  console.log("✅ Contact added:", newContact);
  res.status(201).json({
    message: "Contact added successfully",
    contact: newContact
  });
});

// 🔍 Filter contacts
app.post("/get-contacts", (req, res) => {
  const { filter } = req.body;
  console.log("🔍 Received filter request:", filter);

  if (!filter || typeof filter !== "string") {
    console.log("❌ Invalid filter:", filter);
    return res.status(400).json({ error: "Filter is required and must be a string" });
  }

  const lower = filter.toLowerCase();
  const results = contacts.filter(c =>
    c.FirstName.toLowerCase().includes(lower) ||
    c.LastName.toLowerCase().includes(lower) ||
    c.Email.toLowerCase().includes(lower)
  );

  console.log(`✅ Found ${results.length} matching contacts`);
  res.json({
    count: results.length,
    contacts: results,
    message: "Contacts retrieved using filter"
  });
});

// 🔁 Update contact
app.put("/update-contact", (req, res) => {
  const { Id, FirstName, LastName, Email } = req.body;
  console.log("🔁 Update request received:", req.body);

  if (!Id) {
    console.log("❌ Missing Id in request");
    return res.status(400).json({ error: "Contact Id is required." });
  }

  const contact = contacts.find(c => c.Id === Id);
  if (!contact) {
    console.log("❌ Contact not found for Id:", Id);
    return res.status(404).json({ error: "Contact not found." });
  }

  if (FirstName) contact.FirstName = FirstName;
  if (LastName) contact.LastName = LastName;
  if (Email) contact.Email = Email;

  console.log("✅ Contact updated:", contact);
  res.json({
    message: "Contact updated successfully",
    contact
  });
});

// ❌ Delete contact
app.delete("/delete-contact", (req, res) => {
  const { Id } = req.body;
  console.log("🗑️ Delete request received:", Id);

  if (!Id) {
    console.log("❌ Missing Id in delete request");
    return res.status(400).json({ error: "Contact Id is required." });
  }

  const index = contacts.findIndex(c => c.Id === Id);
  if (index === -1) {
    console.log("❌ Contact not found for deletion:", Id);
    return res.status(404).json({ error: "Contact not found." });
  }

  const removed = contacts.splice(index, 1);
  console.log("✅ Contact deleted:", removed[0]);

  res.json({
    message: "Contact deleted successfully",
    deleted: removed[0]
  });
});

// 📄 Serve plugin manifest
app.get("/.well-known/ai-plugin.json", (req, res) => {
  console.log("📄 Serving ai-plugin.json");
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

// 📄 Serve OpenAPI
app.get("/openapi.yaml", (req, res) => {
  console.log("📄 Serving openapi.yaml");
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

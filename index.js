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

// 🔍 Filter contacts
app.post("/get-contacts", (req, res) => {
  const { filter } = req.body;

  if (!filter || typeof filter !== "string") {
    return res.status(400).json({ error: "Filter is required and must be a string" });
  }

  const lower = filter.toLowerCase();
  const results = contacts.filter(c =>
    c.FirstName.toLowerCase().includes(lower) ||
    c.LastName.toLowerCase().includes(lower) ||
    c.Email.toLowerCase().includes(lower)
  );

  res.json({
    count: results.length,
    contacts: results,
    message: "Contacts retrieved using filter"
  });
});

// 🔁 Update contact
app.put("/update-contact", (req, res) => {
  const { Id, FirstName, LastName, Email } = req.body;

  if (!Id) {
    return res.status(400).json({ error: "Contact Id is required." });
  }

  const contact = contacts.find(c => c.Id === Id);
  if (!contact) {
    return res.status(404).json({ error: "Contact not found." });
  }

  if (FirstName) contact.FirstName = FirstName;
  if (LastName) contact.LastName = LastName;
  if (Email) contact.Email = Email;

  res.json({
    message: "Contact updated successfully",
    contact
  });
});

// ❌ Delete contact
app.delete("/delete-contact", (req, res) => {
  const { Id } = req.body;

  if (!Id) {
    return res.status(400).json({ error: "Contact Id is required." });
  }

  const index = contacts.findIndex(c => c.Id === Id);
  if (index === -1) {
    return res.status(404).json({ error: "Contact not found." });
  }

  const removed = contacts.splice(index, 1);

  res.json({
    message: "Contact deleted successfully",
    deleted: removed[0]
  });
});

// 📄 Serve plugin manifest
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

// 📄 Serve OpenAPI
app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

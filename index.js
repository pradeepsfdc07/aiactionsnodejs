const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔍 Dummy contacts
const contacts = [
  { Id: "001", FirstName: "John", LastName: "Doe", Email: "john@example.com" },
  { Id: "002", FirstName: "Jane", LastName: "Smith", Email: "jane@example.com" },
  { Id: "003", FirstName: "Alice", LastName: "Johnson", Email: "alice@example.com" }
];

// 🌐 GET /get-contacts?filter=John
app.get("/get-contacts", (req, res) => {
  const filter = req.query.filter?.toLowerCase() || "";
  const filtered = contacts.filter(c =>
    `${c.FirstName} ${c.LastName}`.toLowerCase().includes(filter)
  );
  res.json({ count: filtered.length, contacts: filtered });
});

// 🔧 Plugin Manifest
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known", "ai-plugin.json"));
});

// 📄 OpenAPI YAML
app.get("/openapi.yaml", (req, res) => {
  res.setHeader("Content-Type", "text/yaml");
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start server
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

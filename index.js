const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔍 Dummy contact list
const contacts = [
  { Id: "001", FirstName: "John", LastName: "Doe", Email: "john@example.com" },
  { Id: "002", FirstName: "Jane", LastName: "Smith", Email: "jane@example.com" }
];

// 📄 Serve ai-plugin.json
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known", "ai-plugin.json"));
});

// 📄 Serve openapi.yaml
app.get("/openapi.yaml", (req, res) => {
  res.setHeader("Content-Type", "text/yaml");
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🧪 GET /get-contacts - return test data
app.get("/get-contacts", (req, res) => {
  res.json({ contacts });
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

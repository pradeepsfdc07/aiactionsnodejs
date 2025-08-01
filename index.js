// 📘 Mock Salesforce Multi-Object API Server
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🔧 Mock table data
const tables = {
  contact: [
    { Id: "001", FirstName: "John", LastName: "Doe", Email: "john@example.com" },
    { Id: "002", FirstName: "Jane", LastName: "Smith", Email: "jane@example.com" },
    { Id: "003", FirstName: "Sam", LastName: "Wilson", Email: "sam@example.com" }
  ],
  account: [],
  lead: []
};

// 🛠 Utility to get table
function getTable(tablename) {
  if (!tablename || !tables[tablename]) {
    return null;
  }
  return tables[tablename];
}

// ➕ Add record
app.post("/add-record", (req, res) => {
  const { tablename, FirstName, LastName, Email } = req.body;
  console.log("➕ Add request received:", req.body);

  const table = getTable(tablename);
  if (!table) {
    return res.status(400).json({ error: `Invalid tablename: ${tablename}` });
  }

  if (!FirstName || !LastName || !Email) {
    return res.status(400).json({ error: "FirstName, LastName, and Email are required." });
  }

  const newId = (Math.floor(Math.random() * 10000) + 1000).toString();
  const newRecord = { Id: newId, FirstName, LastName, Email };
  table.push(newRecord);

  res.status(201).json({
    message: `${tablename} record added successfully`,
    record: newRecord
  });
});

// 🔍 Filter records
app.post("/get-records", (req, res) => {
  const { tablename, filter } = req.body;
  console.log("🔍 Filter request:", req.body);

  const table = getTable(tablename);
  if (!table) {
    return res.status(400).json({ error: `Invalid tablename: ${tablename}` });
  }

  if (!filter || typeof filter !== "string") {
    return res.status(400).json({ error: "Filter is required and must be a string" });
  }

  const lower = filter.toLowerCase();
  const results = table.filter(r =>
    r.FirstName.toLowerCase().includes(lower) ||
    r.LastName.toLowerCase().includes(lower) ||
    r.Email.toLowerCase().includes(lower)
  );

  res.json({
    count: results.length,
    records: results,
    message: `${tablename} records retrieved using filter`
  });
});

// 🔁 Update record
app.put("/update-record", (req, res) => {
  const { tablename, Id, FirstName, LastName, Email } = req.body;
  console.log("🔁 Update request received:", req.body);

  const table = getTable(tablename);
  if (!table) {
    return res.status(400).json({ error: `Invalid tablename: ${tablename}` });
  }

  const record = table.find(r => r.Id === Id);
  if (!record) {
    return res.status(404).json({ error: `${tablename} record not found.` });
  }

  if (FirstName) record.FirstName = FirstName;
  if (LastName) record.LastName = LastName;
  if (Email) record.Email = Email;

  res.json({
    message: `${tablename} record updated successfully`,
    record
  });
});

// ❌ Delete record (changed to POST)
app.post("/delete-record", (req, res) => {
  const { tablename, Id } = req.body;
  console.log("🗑️ Delete request received:", req.body);

  const table = getTable(tablename);
  if (!table) {
    return res.status(400).json({ error: `Invalid tablename: ${tablename}` });
  }

  const index = table.findIndex(r => r.Id === Id);
  if (index === -1) {
    return res.status(404).json({ error: `${tablename} record not found.` });
  }

  const removed = table.splice(index, 1);

  res.json({
    message: `${tablename} record deleted successfully`,
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

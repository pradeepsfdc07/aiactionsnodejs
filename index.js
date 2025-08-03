// 🔗 External Modules
const express = require("express");
const jsforce = require("jsforce");
require("dotenv").config();

// ⚙️ App Initialization
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// 🔐 Salesforce Auth Helper
async function getSalesforceConnection() {
  const conn = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL });
  await conn.login(
    process.env.SF_USERNAME,
    process.env.SF_PASSWORD + process.env.SF_TOKEN
  );
  return conn;
}

// 📦 Helper: Fetch Contacts
async function getSalesforceContacts({ tablename, filter }) {
  const conn = await getSalesforceConnection();
  const url = `/services/apexrest/MultiObjectAPI?tablename=${tablename}&filter=${encodeURIComponent(filter || "")}`;
  const records = await conn.requestGet(url);
  if (!Array.isArray(records)) return JSON.parse(records);
  return records;
}

// 📦 Helper: Add Contact
async function addSalesforceContact({ FirstName, LastName, Email, tablename = "contact" }) {
  const conn = await getSalesforceConnection();
  const url = `/services/apexrest/MultiObjectAPI`;
  const body = { action: "add", tablename, FirstName, LastName, Email };
  return await conn.requestPost(url, body);
}

// 📦 Helper: Update Contact
async function updateSalesforceContact({ Id, FirstName, LastName, Email, tablename = "contact" }) {
  const conn = await getSalesforceConnection();
  const url = `/services/apexrest/MultiObjectAPI`;
  const body = { action: "update", tablename, Id, FirstName, LastName, Email };
  return await conn.requestPost(url, body);
}

// 📦 Helper: Delete Contact
async function deleteSalesforceContact({ Id, tablename = "contact" }) {
  const conn = await getSalesforceConnection();
  const url = `/services/apexrest/MultiObjectAPI`;
  const body = { action: "delete", tablename, Id };
  return await conn.requestPost(url, body);
}

// 📦 Helper: Send Email
async function sendMailviaSalesforce({ to, subject, text }) {
  const conn = await getSalesforceConnection();
  const url = `/services/apexrest/MultiObjectAPI`;
  const body = { action: "email", Email: to, subject, text };
  return await conn.requestPost(url, body);
}

// 📡 Routes
app.get("/fetch-salesforce-contacts", async (req, res) => {
  try {
    const records = await getSalesforceContacts({ tablename: "contact", filter: req.query.filter || "" });
    res.json({ message: "Salesforce contacts retrieved", count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts", details: err.message });
  }
});

app.post("/add-record", async (req, res) => {
  try {
    const result = await addSalesforceContact(req.body);
    res.status(201).json({ message: "Contact added", result });
  } catch (err) {
    res.status(500).json({ error: "Failed to add contact", details: err.message });
  }
});

app.put("/update-record", async (req, res) => {
  try {
    const result = await updateSalesforceContact(req.body);
    res.json({ message: "Contact updated", result });
  } catch (err) {
    res.status(500).json({ error: "Failed to update contact", details: err.message });
  }
});

app.post("/delete-record", async (req, res) => {
  try {
    const result = await deleteSalesforceContact(req.body);
    res.json({ message: "Contact deleted", result });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete contact", details: err.message });
  }
});

app.post("/send-email", async (req, res) => {
  try {
    const result = await sendMailviaSalesforce(req.body);
    res.json({ message: "Email sent", result });
  } catch (err) {
    res.status(500).json({ error: "Failed to send email", details: err.message });
  }
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

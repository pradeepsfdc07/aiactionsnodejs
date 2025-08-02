const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 🛠 Salesforce Auth Info
let accessToken = null;
let instanceUrl = null;

async function authenticateWithSalesforce() {
  console.log("🔐 Authenticating with Salesforce...");
  const response = await axios.post(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, new URLSearchParams({
    grant_type: "password",
    client_id: process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
    username: process.env.SF_USERNAME,
    password: process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN
  }));

  accessToken = response.data.access_token;
  instanceUrl = response.data.instance_url;
  console.log("✅ Authenticated. Instance URL:", instanceUrl);
}

// 📡 Apex REST Call
async function callSalesforce(method, endpoint = "", payload = {}, query = {}) {
  if (!accessToken || !instanceUrl) await authenticateWithSalesforce();

  const url = `${instanceUrl}/services/apexrest/MultiObjectAPI${endpoint ? "/" + endpoint : ""}`;
  const config = {
    method,
    url,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    params: query,
    data: payload
  };

  console.log(`📤 Calling Salesforce: ${method.toUpperCase()} ${url}`);
  if (Object.keys(query).length > 0) console.log("🧩 Query Params:", query);
  if (payload && method.toLowerCase() !== "get") console.log("📦 Payload:", payload);

  try {
    const response = await axios(config);
    console.log("✅ Salesforce Response:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Salesforce Error:", err.response?.data || err.message);
    throw err;
  }
}

// ➕ Add Record
app.post("/add-record", async (req, res) => {
  console.log("➡️ POST /add-record");
  try {
    const result = await callSalesforce("post", "", {
      ...req.body,
      action: "add"
    });
    res.status(201).json(result);
  } catch (err) {
    console.error("🚫 Add Record Error:", err.message);
    res.status(500).json({ error: "Failed to add record" });
  }
});

// 🔍 Get Records
app.post("/get-records", async (req, res) => {
  console.log("➡️ POST /get-records");
  try {
    const result = await callSalesforce("get", "", null, {
      tablename: req.body.tablename,
      filter: req.body.filter
    });
    res.json(result);
  } catch (err) {
    console.error("🚫 Get Records Error:", err.message);
    res.status(500).json({ error: "Failed to retrieve records" });
  }
});

// 🔁 Update Record
app.post("/update-record", async (req, res) => {
  console.log("➡️ POST /update-record");
  try {
    const result = await callSalesforce("post", "", {
      ...req.body,
      action: "update"
    });
    res.json(result);
  } catch (err) {
    console.error("🚫 Update Record Error:", err.message);
    res.status(500).json({ error: "Failed to update record" });
  }
});

// ❌ Delete Record
app.post("/delete-record", async (req, res) => {
  console.log("➡️ POST /delete-record");
  try {
    const result = await callSalesforce("post", "", {
      ...req.body,
      action: "delete"
    });
    res.json(result);
  } catch (err) {
    console.error("🚫 Delete Record Error:", err.message);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

// 📧 Send Email
app.post("/send-email", async (req, res) => {
  console.log("➡️ POST /send-email");
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    console.error("🚫 Missing email fields");
    return res.status(400).json({ error: "to, subject, and text are required." });
  }

  try {
    const result = await callSalesforce("post", "", {
      Email: to,
      subject,
      text,
      action: "email"
    });
    res.json(result);
  } catch (err) {
    console.error("🚫 Email Error:", err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// 📄 Plugin manifest
app.get("/.well-known/ai-plugin.json", (req, res) => {
  console.log("➡️ GET /.well-known/ai-plugin.json");
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

// 📄 OpenAPI YAML
app.get("/openapi.yaml", (req, res) => {
  console.log("➡️ GET /openapi.yaml");
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Mock Salesforce API Server running at http://localhost:${PORT}`);
});

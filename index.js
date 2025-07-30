const express = require("express");
const axios = require("axios");
const path = require("path");
const jsforce = require("jsforce");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MCP_ENDPOINT = "/mcp";

// 🔐 Salesforce connection
async function connectToSalesforce() {
  console.log("🔐 Connecting to Salesforce...");
  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL
  });

  await conn.login(
    process.env.SF_USERNAME,
    process.env.SF_PASSWORD + process.env.SF_TOKEN
  );

  console.log("✅ Connected to:", conn.instanceUrl);
  return conn;
}

// 📦 Perform Create/Update/Delete Contact via Apex
async function performContactAction(contactPayload) {
  console.log("📦 Contact action payload:", contactPayload);
  const conn = await connectToSalesforce();

  const url = `${conn.instanceUrl}/services/apexrest/ContactAPI`;
  const headers = {
    Authorization: `Bearer ${conn.accessToken}`,
    "Content-Type": "application/json"
  };

  const response = await axios.post(url, contactPayload, { headers });
  console.log("📥 Apex response:", response.data);
  return response.data;
}

// 🔍 Query Contacts with SOQL filter
async function queryContactsWithSOQLFilter(filter) {
  console.log("🔍 Using filter:", filter);

  const conn = await connectToSalesforce();

  if (!filter || typeof filter !== "string") {
    throw new Error("Missing or invalid SOQL filter.");
  }

  if (/delete|insert|update/i.test(filter)) {
    throw new Error("Unsafe SOQL keyword in filter.");
  }

  const query = `SELECT Id, FirstName, LastName, Email, Phone, CreatedDate FROM Contact WHERE ${filter}`;
  console.log("🧠 Executing query:", query);

  const result = await conn.query(query);
  console.log("✅ Records found:", result.records.length);
  return result.records;
}

// 🧠 MCP Method Handlers
const mcpMethods = {
  getContactsUsingFilter: async ({ filter }) => {
    const contacts = await queryContactsWithSOQLFilter(filter);
    return {
      count: contacts.length,
      contacts,
      Message: `Contacts retrieved using filter: ${filter}`
    };
  }
};

// ⚙️ MCP Protocol Handler
app.post(MCP_ENDPOINT, async (req, res) => {
  const { method, params, id } = req.body;
  console.log("📡 MCP Request →", method, params);

  const handler = mcpMethods[method];

  if (!handler) {
    return res.status(400).json({
      jsonrpc: "2.0",
      error: { code: -32601, message: "Method not found" },
      id
    });
  }

  try {
    const result = await handler(params);
    res.json({ jsonrpc: "2.0", result, id });
  } catch (error) {
    console.error("❌ MCP method error:", error.message);
    res.json({
      jsonrpc: "2.0",
      error: { code: -32000, message: error.message },
      id
    });
  }
});

// 🌐 POST /contact-action
app.post("/contact-action", async (req, res) => {
  try {
    const contactId = await performContactAction(req.body);
    res.status(201).json({
      Id: contactId,
      Message: `Contact ${req.body.operationtype}d successfully`
    });
  } catch (error) {
    console.error("❌ /contact-action error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🌐 POST /contacts-by-filter
app.post("/contacts-by-filter", async (req, res) => {
  try {
    const { filter } = req.body;

    if (!filter || typeof filter !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'filter'" });
    }

    const contacts = await queryContactsWithSOQLFilter(filter);
    res.status(200).json({
      count: contacts.length,
      contacts,
      Message: "Contacts retrieved using custom filter"
    });
  } catch (error) {
    console.error("❌ /contacts-by-filter error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 📄 Serve plugin + API spec
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Launch
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

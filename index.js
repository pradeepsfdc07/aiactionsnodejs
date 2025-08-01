const express = require("express");
const axios = require("axios");
const path = require("path");
const jsforce = require("jsforce");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MCP_ENDPOINT = "/mcp";

// 🔐 Connect to Salesforce
async function connectToSalesforce() {
  const conn = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL });

  console.log("🔐 Logging into Salesforce...");
  await conn.login(
    process.env.SF_USERNAME,
    process.env.SF_PASSWORD + process.env.SF_TOKEN
  );
  console.log("✅ Salesforce login successful:", conn.userInfo.id);

  return conn;
}

// 📦 Perform Contact Create/Update/Delete via Apex
async function performContactAction(contactPayload) {
  console.log("📦 Contact action payload:", contactPayload);
  const conn = await connectToSalesforce();
  const url = `${conn.instanceUrl}/services/apexrest/ContactAPI`;

  const headers = {
    Authorization: `Bearer ${conn.accessToken}`,
    "Content-Type": "application/json"
  };

  const response = await axios.post(url, contactPayload, { headers });
  return response.data;
}

// 🔍 Query contacts using custom SOQL
async function queryContactsWithSOQLFilter(filter) {
  if (!filter || typeof filter !== "string") {
    throw new Error("Missing or invalid SOQL filter.");
  }

  if (/delete|insert|update/i.test(filter)) {
    throw new Error("Unsafe SOQL keyword detected in filter.");
  }

  const conn = await connectToSalesforce();
  const query = `SELECT Id, FirstName, LastName, Email, Phone, CreatedDate FROM Contact WHERE ${filter}`;
  console.log("🔍 Executing SOQL:", query);

  const result = await conn.query(query);
  return result.records;
}

// 🧠 MCP Methods
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

// ⚙️ MCP JSON-RPC Endpoint
app.post(MCP_ENDPOINT, async (req, res) => {
  const { method, params, id } = req.body;
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
    console.error("❌ MCP Method Error:", error.message);
    res.json({
      jsonrpc: "2.0",
      error: { code: -32000, message: error.message },
      id
    });
  }
});

// 🌐 REST: /contact-action
app.post("/contact-action", async (req, res) => {
  try {
    const contactId = await performContactAction(req.body);
    res.status(201).json({
      Id: contactId,
      Message: `Contact ${req.body.operationtype}d successfully`
    });
  } catch (error) {
    console.error("❌ /contact-action Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🌐 REST: /contacts-by-filter
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
    console.error("❌ /contacts-by-filter Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 📄 Serve ai-plugin.json with CORS
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

// 📄 Serve openapi.yaml with CORS
app.get("/openapi.yaml", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/yaml");
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start Express server
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

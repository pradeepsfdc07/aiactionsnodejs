// 📦 Combined MCP + OpenAPI + Apex REST wrapper server

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const jsforce = require("jsforce");
require("dotenv").config();

const app = express();
app.use(express.json());

// 🌐 Constants
const PORT = process.env.PORT || 3000;
const MCP_ENDPOINT = "/mcp";

// 🔐 Salesforce OAuth Login
async function connectToSalesforce() {
  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL
  });

  await conn.login(
    process.env.SF_USERNAME,
    process.env.SF_PASSWORD + process.env.SF_TOKEN
  );

  return conn;
}


// 🔍 Get Contacts with Custom Filter
async function getContactsByCustomFilter(filter) {
  const conn = await connectToSalesforce();

  // Basic protection: prevent destructive keywords (optional, for safety)
  if (!filter || /DELETE|UPDATE|INSERT/i.test(filter)) {
    throw new Error("Invalid or unsafe filter provided.");
  }

  const query = `SELECT Id, Name, Email, CreatedDate FROM Contact WHERE ${filter}`;
  const result = await conn.query(query);
  return result.records;
}


// 📱 Call Apex REST API by Email
async function callContactByEmail(email) {
  const conn = await connectToSalesforce();

  const url = `${conn.instanceUrl}/services/apexrest/ContactAPI?email=${encodeURIComponent(email)}`;
  const headers = {
    Authorization: `Bearer ${conn.accessToken}`,
    "Content-Type": "application/json"
  };

  const response = await axios.get(url, { headers });
  return response.data;
}

// 📱 Unified create/update/delete handler
async function contactOperationInSalesforce(contactData) {
  console.log("Contact operation payload:", contactData);
  const conn = await connectToSalesforce();

  const url = `${conn.instanceUrl}/services/apexrest/ContactAPI`;
  const headers = {
    Authorization: `Bearer ${conn.accessToken}`,
    "Content-Type": "application/json"
  };

  const response = await axios.post(url, contactData, { headers });
  return response.data;
}

// 🧠 MCP Methods (using Apex API)
const mcpMethods = {
  getContactByEmail: async ({ email }) => {
    const contact = await callContactByEmail(email);
    return {
      Id: contact.Id,
      Name: contact.Name,
      Email: contact.Email,
      Message: "Contact retrieved using Apex REST"
    };
  },
    getContactsByFilter: async ({ filter }) => {
    const contacts = await getContactsByCustomFilter(filter);
    return {
      count: contacts.length,
      contacts,
      Message: `Contacts retrieved using filter: ${filter}`
    };
  }
};

// ⚙️ MCP Endpoint
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
    res.json({
      jsonrpc: "2.0",
      error: { code: -32000, message: error.message },
      id
    });
  }
});

// 🌐 Custom REST Endpoint: /custom-contact?email=
app.get("/custom-contact", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Provide 'email' query param." });
  }

  try {
    const contact = await callContactByEmail(email);
    res.json({
      Id: contact.Id,
      Name: contact.Name,
      Email: contact.Email,
      Message: "Contact retrieved using custom Apex endpoint"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🌐 Unified Create/Update/Delete Contact Endpoint
app.post("/contact-action", async (req, res) => {
  try {
    const contactId = await contactOperationInSalesforce(req.body);
    res.status(201).json({
      Id: contactId,
      Message: `Contact ${req.body.operationtype}d successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🗂️ Serve OpenAPI and Manifest files
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

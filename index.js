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

// 📡 Call Apex REST API
async function callContactAPI(id) {
  const conn = await connectToSalesforce();

  const url = `${conn.instanceUrl}/services/apexrest/ContactAPI/${id}`;
  const headers = {
    Authorization: `Bearer ${conn.accessToken}`,
    "Content-Type": "application/json"
  };

  const response = await axios.get(url, { headers });
  return response.data;
}

// 🧠 MCP Methods (now using Apex API)
const mcpMethods = {
  getContactById: async ({ id }) => {
    const contact = await callContactAPI(id);
    return {
      Id: contact.Id,
      Name: contact.Name,
      Email: contact.Email,
      Message: "Contact retrieved using Apex REST"
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

// 🌐 REST Endpoint: GET /contact/:id (uses Apex too)
app.get("/contact/:id", async (req, res) => {
  try {
    const contact = await callContactAPI(req.params.id);
    res.json({
      Id: contact.Id,
      Name: contact.Name,
      Email: contact.Email,
      Message: "Contact retrieved using Apex REST"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🌐 Custom REST Endpoint: /custom-contact?id=
app.get("/custom-contact", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Provide 'id' query param." });
  }

  try {
    const contact = await callContactAPI(id);
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

// 🗂️ Serve OpenAPI and Manifest files
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

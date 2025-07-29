// 📦 Combined MCP + OpenAPI + REST wrapper server

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();
const jsforce = require("jsforce");
app.use(express.json());

require("dotenv").config();

// 🌐 Constants
const PORT = process.env.PORT || 3000;
const MCP_ENDPOINT = "/mcp";

// 🧠 Salesforce Connection
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

// 🧠 MCP Methods
const mcpMethods = {
  getContactById: async ({ id }) => {
    const conn = await connectToSalesforce();
    const contact = await conn.sobject("Contact").retrieve(id);

    return {
      Id: contact.Id,
      Name: contact.Name,
      Email: contact.Email,
      Message: "Contact retrieved from Salesforce"
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

// 🌐 REST Wrapper for OpenAPI
app.get("/contact/:id", async (req, res) => {
  try {
    const result = await mcpMethods.getContactById({ id: req.params.id });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🌐 Custom REST Endpoint: /custom-contact?id= or ?email=
app.get("/custom-contact", async (req, res) => {
  const { id, email } = req.query;

  if (!id && !email) {
    return res.status(400).json({ error: "Provide 'id' or 'email' query param." });
  }

  try {
    const conn = await connectToSalesforce();
    let contact;

    if (id) {
      contact = await conn.sobject("Contact").retrieve(id);
    } else if (email) {
      contact = await conn.sobject("Contact").findOne({ Email: email }, "Id, Name, Email");
    }

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({
      Id: contact.Id,
      Name: contact.Name,
      Email: contact.Email,
      Message: "Contact retrieved using custom endpoint"
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

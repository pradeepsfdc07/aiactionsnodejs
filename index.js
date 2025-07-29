// 📦 Combined MCP + OpenAPI + REST wrapper server

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());

// 🌐 Constants
const PORT = process.env.PORT || 3000;
const MCP_ENDPOINT = "/mcp";

// 🧠 MCP Methods
const mcpMethods = {
  getContactById: async ({ id }) => {
    // This is where you'd call Salesforce or mock it for now
    return {
      Id: id,
      Name: "John Doe",
      Email: "john@example.com"
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

// 🗂️ Serve OpenAPI and Manifest files
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start Server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

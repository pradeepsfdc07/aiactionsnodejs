const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 📄 Serve ai-plugin.json
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known", "ai-plugin.json"));
});

// 📄 Serve openapi.yaml
app.get("/openapi.yaml", (req, res) => {
  res.setHeader("Content-Type", "text/yaml");
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🧪 Test Endpoint
app.get("/hello", (req, res) => {
  res.json({ message: "Hello from plugin!" });
});

// 🚀 Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

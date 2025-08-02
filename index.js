// 📘 Mock Salesforce Multi-Object API Server
const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const jsforce = require("jsforce");
require("dotenv").config();

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
  if (!tablename || !tables[tablename]) return null;
  return tables[tablename];
}

// 🔐 Salesforce Contact Fetch (no client_id needed)
async function getSalesforceContacts(methodprops) {
  let {tablename, filter}= methodprops;
  try {
    console.log("🔐 Logging into Salesforce...");
    const conn = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL });

    await conn.login(
      process.env.SF_USERNAME,
      process.env.SF_PASSWORD + process.env.SF_TOKEN
    );

    console.log("✅ Logged into Salesforce");

    const url = `/services/apexrest/MultiObjectAPI?tablename=contact&filter=${encodeURIComponent(filter)}`;
    console.log("🌐 Calling Apex REST:", url);

    const records = await conn.requestGet(url);
    if (Array.isArray(records)) {
  console.log(`✅ Got ${records.length} records from Apex REST`);
} else {
  console.log("❌ Expected an array but got:", typeof records);
  let recarr = JSON.parse(records);
  console.log(recarr);
  return recarr;
}
    console.log(records);
    console.log(`📦 Retrieved ${records.length} contact(s) from Apex REST`);

    return records;
  } catch (err) {
    console.error("❌ Apex REST call failed:", err.message);
    throw err;
  }
}



async function addSalesforceContact(methodprops) {
  const { FirstName, LastName, Email, tablename = "contact" } = methodprops;

  try {
    console.log("🔐 Logging into Salesforce...");
    const conn = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL });

    await conn.login(
      process.env.SF_USERNAME,
      process.env.SF_PASSWORD + process.env.SF_TOKEN
    );

    console.log("✅ Logged into Salesforce");

    const url = `/services/apexrest/MultiObjectAPI`;

    const body = {
      action: "add",
      tablename,
      FirstName,
      LastName,
      Email
    };

    console.log("📤 Sending POST to Apex REST:", url);
    console.log("📦 Payload:", body);

    const response = await conn.requestPost(url, body);

    console.log("✅ Contact added. Response:", response);
    return response;
  } catch (err) {
    console.error("❌ Failed to add contact:", err.message);
    throw err;
  }
}

async function updateSalesforceContact(methodprops) {
  const { FirstName, LastName, Email, tablename = "contact" } = methodprops;

  try {
    console.log("🔐 Logging into Salesforce...");
    const conn = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL });

    await conn.login(
      process.env.SF_USERNAME,
      process.env.SF_PASSWORD + process.env.SF_TOKEN
    );

    console.log("✅ Logged into Salesforce");

    const url = `/services/apexrest/MultiObjectAPI`;

    const body = {
      action: "update",
      tablename,
      FirstName,
      LastName,
      Email
    };

    console.log("📤 Sending POST to Apex REST:", url);
    console.log("📦 Payload:", body);

    const response = await conn.requestPost(url, body);

    console.log("✅ Contact added. Response:", response);
    return response;
  } catch (err) {
    console.error("❌ Failed to add contact:", err.message);
    throw err;
  }
}


async function deleteSalesforceContact(methodprops) {
  const { FirstName, LastName, Email, tablename = "contact" } = methodprops;

  try {
    console.log("🔐 Logging into Salesforce...");
    const conn = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL });

    await conn.login(
      process.env.SF_USERNAME,
      process.env.SF_PASSWORD + process.env.SF_TOKEN
    );

    console.log("✅ Logged into Salesforce");

    const url = `/services/apexrest/MultiObjectAPI`;

    const body = {
      action: "delete",
      tablename,
      FirstName,
      LastName,
      Email
    };

    console.log("📤 Sending POST to Apex REST:", url);
    console.log("📦 Payload:", body);

    const response = await conn.requestPost(url, body);

    console.log("✅ Contact added. Response:", response);
    return response;
  } catch (err) {
    console.error("❌ Failed to add contact:", err.message);
    throw err;
  }
}


// 🆕 GET /fetch-salesforce-contacts
app.get("/fetch-salesforce-contacts", async (req, res) => {
  try {
    console.log("📲 GET /fetch-salesforce-contacts called");
    const records = await getSalesforceContacts();
    res.json({ message: "Salesforce contacts retrieved", count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contacts from Salesforce" });
  }
});

// ➕ POST /add-record
app.post("/add-record", async (req, res) => {
  const { tablename, FirstName, LastName, Email } = req.body;
  console.log("📩 Add record:", req.body);
  const table = getTable(tablename);
  if (!table) return res.status(400).json({ error: `Invalid tablename: ${tablename}` });
  if (!FirstName || !LastName || !Email)
    return res.status(400).json({ error: "FirstName, LastName, and Email are required." });

  const newId = (Math.floor(Math.random() * 10000) + 1000).toString();
  const newRecord = { Id: newId, FirstName, LastName, Email };
  table.push(newRecord);

  console.log("✅ Record added:", newRecord);

  let addSalesforceContactresp = await addSalesforceContact(req.body);
 console.log("✅ addSalesforceContactresp:", addSalesforceContactresp);

  res.status(201).json({ message: `${tablename} record added successfully`, record: newRecord });
});

// 🔍 POST /get-records
app.post("/get-records", async (req, res) => {
  const { tablename, filter } = req.body;
  console.log(`📥 POST /get-records: tablename=${tablename}, filter=${filter}`);

  if (tablename === "contact") {
    try {
      const sfRecords = await getSalesforceContacts({tablename:tablename, filter:filter});

      const filtered = filter
        ? sfRecords.filter(r =>
            (r.FirstName || "").toLowerCase().includes(filter.toLowerCase()) ||
            (r.LastName || "").toLowerCase().includes(filter.toLowerCase()) ||
            (r.Email || "").toLowerCase().includes(filter.toLowerCase())
          )
        : sfRecords;

      console.log(`🎯 Filtered to ${filtered.length} Salesforce record(s)`);
      return res.json({
        count: filtered.length,
        records: filtered,
        message: `Salesforce contact records retrieved`
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch Salesforce records" });
    }
  }

  // Mock table fallback
  const table = getTable(tablename);
  if (!table) return res.status(400).json({ error: `Invalid tablename: ${tablename}` });
  if (!filter || typeof filter !== "string")
    return res.status(400).json({ error: "Filter is required and must be a string" });

  const lower = filter.toLowerCase();
  const results = table.filter(r =>
    r.FirstName.toLowerCase().includes(lower) ||
    r.LastName.toLowerCase().includes(lower) ||
    r.Email.toLowerCase().includes(lower)
  );

  console.log(`📁 Found ${results.length} record(s) in mock table`);
  res.json({ count: results.length, records: results, message: `${tablename} records retrieved` });
});

// 🔁 PUT /update-record
app.put("/update-record", async (req, res) => {
  const { tablename, Id, FirstName, LastName, Email } = req.body;
  console.log("✏️ Update record:", req.body);
  const table = getTable(tablename);
  if (!table) return res.status(400).json({ error: `Invalid tablename: ${tablename}` });

  const record = table.find(r => r.Id === Id);
  if (!record) return res.status(404).json({ error: `${tablename} record not found.` });

  if (FirstName) record.FirstName = FirstName;
  if (LastName) record.LastName = LastName;
  if (Email) record.Email = Email;

  console.log("✅ Record updated:", record);


   let updateSalesforceContactresp = await updateSalesforceContact(req.body);
 console.log("✅ updateSalesforceContactresp:", updateSalesforceContactresp);


    res.json({
      message: "Salesforce contact updated successfully",
      result
    });

  res.json({ message: `${tablename} record updated successfully`, record });
});

// ❌ POST /delete-record
app.post("/delete-record", async (req, res) => {
  const { tablename, Id } = req.body;
  console.log("🗑️ Delete request:", req.body);
  const table = getTable(tablename);
  if (!table) return res.status(400).json({ error: `Invalid tablename: ${tablename}` });

  const index = table.findIndex(r => r.Id === Id);
  if (index === -1) return res.status(404).json({ error: `${tablename} record not found.` });

  const removed = table.splice(index, 1);
  console.log("🧹 Record deleted:", removed[0]);

  let deleteSalesforceContactresp = await deleteSalesforceContact(req.body);
 console.log("✅ deleteSalesforceContactresp:", deleteSalesforceContactresp);


  res.json({ message: `${tablename} record deleted successfully`, deleted: removed[0] });
});

// 📧 POST /send-email
app.post("/send-email", async (req, res) => {
  const { to, subject, text } = req.body;
  console.log("📨 Send email:", req.body);

  if (!to || !subject || !text) {
    return res.status(400).json({ error: "to, subject, and text are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📤 Email sent:", info.messageId);
    res.json({ message: "Email sent successfully", messageId: info.messageId });
  } catch (error) {
    console.error("❌ Email send failed:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// 📄 Serve plugin manifest
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known/ai-plugin.json"));
});

// 📄 Serve OpenAPI
app.get("/openapi.yaml", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.yaml"));
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

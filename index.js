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

// 🔐 Salesforce Record Fetch (no client_id needed)
async function getSalesforceRecords(methodprops) {
  let {tablename, filter}= methodprops;
  try {
    console.log("🔐 Logging into Salesforce...");
    const conn = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL });

    await conn.login(
      process.env.SF_USERNAME,
      process.env.SF_PASSWORD + process.env.SF_TOKEN
    );

    console.log("✅ Logged into Salesforce");

    const url = `/services/apexrest/MultiObjectAPI?tablename=${tablename}&filter=${encodeURIComponent(filter)}`;
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
    console.log(`📦 Retrieved ${records.length} ${tablename}(s) from Apex REST`);

    return records;
  } catch (err) {
    console.error("❌ Apex REST call failed:", err.message);
    throw err;
  }
}



async function addSalesforceRecord(methodprops) {
  const { FirstName, LastName, Email, tablename  } = methodprops;

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

    console.log("✅ Record added. Response:", response);
    return response;
  } catch (err) {
    console.error("❌ Failed to add ${tablename}:", err.message);
    throw err;
  }
}

async function updateSalesforceRecord(methodprops) {
  const { FirstName, LastName, Email, Id, tablename  } = methodprops;

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
      Email,
      Id
    };

    console.log("📤 Sending POST to Apex REST:", url);
    console.log("📦 Payload:", body);

    const response = await conn.requestPost(url, body);

    console.log("✅ Record added. Response:", response);
    return response;
  } catch (err) {
    console.error("❌ Failed to add ${tablename}:", err.message);
    throw err;
  }
}


async function deleteSalesforceRecord(methodprops) {
  const { FirstName, LastName, Email, Id, tablename  } = methodprops;

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
      Email,
      Id
    };

    console.log("📤 Sending POST to Apex REST:", url);
    console.log("📦 Payload:", body);

    const response = await conn.requestPost(url, body);

    console.log("✅ Record added. Response:", response);
    return response;
  } catch (err) {
    console.error("❌ Failed to add ${tablename}:", err.message);
    throw err;
  }
}

async function sendMailviaSalesforce(methodprops) {
  const { from, to, subject, body, template, } = methodprops;

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
      ...methodprops,
      action: "sendemail",
    };

    console.log("📤 Sending POST to Apex REST:", url);
    console.log("📦 Payload:", body);

    const response = await conn.requestPost(url, body);

    console.log("✅ sendemail. Response:", response);
    return response;
  } catch (err) {
    console.error("❌ Failed to sendemail:", err.message);
    throw err;
  }
}


// 🆕 GET /fetch-salesforce-records
app.get("/fetch-salesforce-records", async (req, res) => {
  try {
    console.log("📲 GET /fetch-salesforce-records called");
    const records = await getSalesforceRecords();
    res.json({ message: "Salesforce records retrieved", count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch records from Salesforce" });
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

  let addSalesforceRecordresp = await addSalesforceRecord(req.body);
 console.log("✅ addSalesforceRecordresp:", addSalesforceRecordresp);

  res.status(201).json({ message: `${tablename} record added successfully`, record: newRecord });
});

// 🔍 POST /get-records
app.post("/get-records", async (req, res) => {
  const { tablename, filter } = req.body;
  console.log(`📥 POST /get-records: tablename=${tablename}, filter=${filter}`);

   try {
    if(tablename !== undefined &&  tablename !== ''){
      const sfRecords = await getSalesforceRecords({tablename:tablename, filter:filter});

      console.log(`🎯 sfRecords to ${sfRecords.length} Salesforce record(s)`);
      return res.json({
        count: sfRecords.length,
        records: sfRecords,
        message: tablename+`records retrieved`
      });
    }
    else{
   return res.json({
        count: 0,
        records: [],
        message: 'tablename is blank'
      });
 
    }
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch Salesforce records" });
    }
  

  
});

// 🔁 PUT /update-record
app.put("/update-record", async (req, res) => {
  const { tablename, Id, FirstName, LastName, Email } = req.body;
  console.log("✏️ Update record:", req.body);
  const table = getTable(tablename);
  if (!table) return res.status(400).json({ error: `Invalid tablename: ${tablename}` });

   let updateSalesforceRecordresp = await updateSalesforceRecord(req.body);
 console.log("✅ updateSalesforceRecordresp:", updateSalesforceRecordresp);


    res.json({
      message: tablename+" updated successfully",
    });


});

// ❌ POST /delete-record
app.post("/delete-record", async (req, res) => {
  const { tablename, Id } = req.body;
  console.log("🗑️ Delete request:", req.body);
  const table = getTable(tablename);
  if (!table) return res.status(400).json({ error: `Invalid tablename: ${tablename}` });

  let deleteSalesforceRecordresp = await deleteSalesforceRecord(req.body);
 console.log("✅ deleteSalesforceRecordresp:", deleteSalesforceRecordresp);


  res.json({ message: `${tablename} record deleted successfully` });
});

// 📧 POST /send-email
app.post("/send-email", async (req, res) => {
  const { to, subject, text } = req.body;
  console.log("📨 Send email:", req.body);

  if (!to || !subject || !text) {
    return res.status(400).json({ error: "to, subject, and text are required." });
  }

  try {
   
    let sendMailviaSalesforceresp = await sendMailviaSalesforce(req.body);
 console.log("✅ sendMailviaSalesforceresp:", sendMailviaSalesforceresp);

 res.json({ message: "Email sent successfully" });
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

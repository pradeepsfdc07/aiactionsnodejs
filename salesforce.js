const axios = require("axios");

const SF_LOGIN_URL = process.env.SF_LOGIN_URL || "https://login.salesforce.com";
const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const SF_USERNAME = process.env.SF_USERNAME;
const SF_PASSWORD = process.env.SF_PASSWORD;
const SF_SECURITY_TOKEN = process.env.SF_SECURITY_TOKEN;

let accessToken = null;
let instanceUrl = null;

async function authenticateWithSalesforce() {
  const url = `${SF_LOGIN_URL}/services/oauth2/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("client_id", SF_CLIENT_ID);
  params.append("client_secret", SF_CLIENT_SECRET);
  params.append("username", SF_USERNAME);
  params.append("password", SF_PASSWORD + SF_SECURITY_TOKEN);

  const response = await axios.post(url, params);
  accessToken = response.data.access_token;
  instanceUrl = response.data.instance_url;

  return { accessToken, instanceUrl };
}

async function callApex(method, endpoint, payload = null, queryParams = null) {
  if (!accessToken || !instanceUrl) {
    await authenticateWithSalesforce();
  }

  const url =
    instanceUrl +
    `/services/apexrest/MultiObjectAPI${endpoint ? "/" + endpoint : ""}` +
    (queryParams ? "?" + new URLSearchParams(queryParams).toString() : "");

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: payload
    });
    return response.data;
  } catch (error) {
    console.error("❌ Salesforce API Error:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = { callApex };

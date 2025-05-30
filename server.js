// index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

let accessToken = null;
let accessTokenExpiresAt = 0;

// Your GHL OAuth credentials
const CLIENT_ID = "68326a70642d282656e52d32-mb6t4zus";
const CLIENT_SECRET = "2c23317c-6329-4735-9432-aa951210dec3";
let refresh_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODU2NDE0MC44MjMsImV4cCI6MTc4MDEwMDE0MC44MjMsInVuaXF1ZUlkIjoiM2JjYjJiZjQtOGFlZC00ZjM5LTk5MzAtZjhlMGExODYyYjg1IiwidiI6IjIifQ.VWWdYia3blMC4aU80wtuxjJN-L7dyUDaY0cFVreOZcfJzyinaURAWhwgndsgPiq7mM5Tk3oKCyqft7NZbaOaZ_SMqPGsEqFjQOBxnPKa--AZ_bOxbBJRKWnd6h4quIAWXIb90sZeolaaMEdq7e_Nx8q0J8fwmQ07_pUB6enpDQm85q-AA_jW91IjSLm_Hf4oIJGg6sk4hbPcdYw3MTV_JZN1a7PvTbiParHUzl_Qf0TjmVmt5xE2PV7pseZ7eWTRdKyjB3zzA2ITYeKcSYE7n3-ffLulubaimvKBEooay_5XYIJSaFxeBpDS2Y2F6U9VDnk1G15CvYaEXhyisoBYxPnVvCT8O897O2RrQQx-5RhjyZT-R5WuSmSioEouE4j32rX2hDX8OdCUYEnl3GUjYKQYzo1PATK3LAR6ekp4JMKR0CKQ2IYXPniBNEvUmTOeQim72cXGSRYtVNQoX56dPO5y6YbcO_8_OheJ388K2bgU9f4G63h42Gvti2KlvTKUobpuQUEj8Z3lihvJB5FJqCegXGJKXsHWzA_IV8iltFy337mmIE-yr-Q2OJrJgoRB1CZd00W-Vg72BwpqN9IdhXvLkveayTWWU1XYdgRE_5Q-93c9dMbE47tb591yFJ6TQDZ2hZPlYvCDFzypWP4NwVxqY4sZUM3-3L2Vdqwtii8";

const LOCATION_ID = "GhzkVFpQlXpmPVmjkTr2";

// Get a fresh access token using the refresh token
async function refreshAccessToken() {
  try {
    const { data } = await axios.post(
      "https://services.leadconnectorhq.com/oauth/token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = data.access_token;
    refresh_token = data.refresh_token;
    accessTokenExpiresAt = Date.now() + 1000 * 1000 - 30000;

    console.log("✅ Access token refreshed.");
  } catch (err) {
    console.error("❌ Failed to refresh access token:", err.response?.data || err);
  }
}
refreshAccessToken(); // Immediately on startup
setInterval(refreshAccessToken, 30 * 60 * 1000); // Every 30 minutes

async function getContact(contactId, token){
  const result = await axios.get(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
    },
  });
  return result;
}

const getField = (Array, idPart) =>
  Array?.find(f => f.id.includes(idPart))?.value || "N/A";

// Retainer API endpoint
app.get("/payment-plan", async (req, res) => {
  const { contactId } = req.query;
  if (!contactId) return res.status(400).json({ error: "Missing contactId" });

  try {
    // const token = await getAccessToken();
    const result = await getContact(contactId, accessToken);
    console.log(result);
    const contact = result.data.contact;
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    const retainer_amount = getField(contact.customFields, "43IO34Ktu6XtYdKsoaS8");
    const downPayment = getField(contact.customFields, "BHM3kiCNUCXlOKJmPVYV");
    const biweeklyPayments = getField(contact.customFields, "nVWB0ZHS9kLXDDnREItX");

  
    res.json({ retainer: retainer_amount, downPayment:downPayment, biweeklyPayments:biweeklyPayments });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/google-drive", async (req, res) => {
  const { contactId } = req.query;
  if (!contactId) return res.status(400).json({ error: "Missing contactId" });

  try {
    // const token = await getAccessToken();
    const result = await getContact(contactId, accessToken);

    const contact = result.data.contact;
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    const getDocs = getField(contact.customFields, "rv8yYTPNUkSRZ49XSFju");
    const google_drive_link = getField(contact.customFields, "7tvbLQf8NQspE0ryJET0");

  
    res.json({ getDocs: getDocs, google_drive_link:google_drive_link});
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log("✅ Server is running on port", PORT);
});

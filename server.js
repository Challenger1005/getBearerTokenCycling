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
let refresh_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODU4MTQyMy45MzYsImV4cCI6MTc4MDExNzQyMy45MzYsInVuaXF1ZUlkIjoiNTk5OWE1YWQtZWI3OC00NzRjLWE5YTktMGRjZjllYjgzY2UwIiwidiI6IjIifQ.M1RkpwarAxEhORtzYv4mys97VR0FefYScMazv-OOQwD9IfGKq1glatFxX7UD7rfFkfMUrxYOhQPe0CSb5peTH-J5P1FNDl834suwo51IIq9yYZj4pfpBxxwmhWufssxMXQhTCNssZtc_UWeIzL1-pg9zAj1_DORKmqXcGQYi01siWmmXlCjFYec0x1yPgER0N5JaZKs-Hd55Zy0cdMfvlxIzOXL1ZChX6stZVzOL_pcehExaWCuhAVN8Db4ilt6zQIrflMea2hfXsrVt2uAXie5ssbB8PZE8hp8UGuEDwlvyFtPv9Md3yn4fcAyJHYCpq_L6ik89dqOAaGksXrGNzYa32NnW72HomZdmJMKPKCFvrCMC_uzvabK0iX_rwMJZuuBbKy3WP9u28rcHnVdsygrR9QtK_RmjFRk84sBslYfEv1WJsY6CMHVmouiIF1yfZnvXLfzT67zqO0vv79PxHZnnlJorqKLXGqhR6YFl12eR6o1wRXA5st-RrKjq-668kDdfUiTqil0cTctQDNfkXJ-gS16ueuS6IBOjH_ob_8x-szjkscU6D3guWdD96mHEugrP-OvqKGFh2A_wt6Gwbkg-C_1-ew3qSomD96OaY1Jx_eT6TOryZ11ETIcWbT_4e0YKCeB-ws9UbItCdQjT2Q7AXQAhmwxd2dS__rwoDDg";

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
    console.log('access_token=========>', accessToken);
    console.log('refresh_token=========>', refresh_token);
    console.log("✅ Access token refreshed.");
  } catch (err) {
    console.error("❌ Failed to refresh access token:", err.response?.data || err);
  }
}

refreshAccessToken(); // Immediately on startup
setInterval(refreshAccessToken,  60 * 1000); // Every 30 minutes

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
    console.log('payment-plan=======>', result);
    const contact = result.data.contact;
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    const retainer_amount = getField(contact.customFields, "43IO34Ktu6XtYdKsoaS8");
    const downPayment = getField(contact.customFields, "BHM3kiCNUCXlOKJmPVYV");
    const biweeklyPayments = getField(contact.customFields, "nVWB0ZHS9kLXDDnREItX");

  
    res.json({ retainer: retainer_amount, downPayment:downPayment, biweeklyPayments:biweeklyPayments });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/google-drive", async (req, res) => {
  const { contactId } = req.query;
  if (!contactId) return res.status(400).json({ error: "Missing contactId" });

  try {
    // const token = await getAccessToken();
    const result = await getContact(contactId, accessToken);
    console.log('google-drive=======>', result);
    const contact = result.data.contact;
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    const getDocs = getField(contact.customFields, "rv8yYTPNUkSRZ49XSFju");
    const google_drive_link = getField(contact.customFields, "7tvbLQf8NQspE0ryJET0");

  
    res.json({ getDocs: getDocs, google_drive_link:google_drive_link});
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log("✅ Server is running on port", PORT);
});

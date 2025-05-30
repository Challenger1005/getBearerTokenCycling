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
let refresh_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODU4MzQyMC4zNTUsImV4cCI6MTc4MDExOTQyMC4zNTUsInVuaXF1ZUlkIjoiOTdiZTk5ZTctNjQ0ZS00N2VjLThiYjAtZmYwNjdmYmFhMjYxIiwidiI6IjIifQ.E9dz0FD0iEUDW3meuwsOp60i7qaHxRG-FeWtZm0z-bUdJ91jCB2v4cMs7iskjS0J5l1sRTHrJi-JSlzqbWf1Txcy_VUbpTz8FpGvE8g4fVLKTJjmmvgIqzAmHOfLzUJCU4Mll0BNAPxlLG_zAeXTPIS2oWlHcKflN_ODCCTXyAqEEoEB9vVhaay0wRDeiDseRDSZuTI-BTAZPUNZ7wZJ4WVga826YyzawF-Sl5wbKW0Ne8QfTlxu9_BkNSyusAmyW_cIjNuQ89cFawHP9fryqFB8jeSlWhyq1oE9PYd_1mt6bTxYBEJx2XMPxPphC0K_ojkfVuJp0qtuOo7bYR0lfXkSmaZ9ulBgXLes3jaqVgl7K5E_dn-zm5xBgJvhX-ZGefMBS-bwviKCPcJVYTLIZdOpcP9U5nT0cSp2Cyx4mZsmU1qjhDb-45vV8QReS2a0nQQvTjUJA31LmpNR9FqIUNaWn5ENabX9wpqUgF0H6N24ld2__HsLZo-gfi7Vry1tZwGciX-vMP_snbyBOgDp0QObTVm3iYVL1sHGMkw2gXtTYkrKT9zqynpM2HJ2JiXIbylIe5R_wB5QvvfGGjxD2ETeQpT-ROKvAUFATc4vGkxeHWOAvUTr7uOJS3Vl945BEen9nryP83yaL8RLj5I1ajux9yJvvxgV-iHYxrPtT8A";

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
setInterval(refreshAccessToken,   3600 * 23 * 1000); // Every 30 minutes

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

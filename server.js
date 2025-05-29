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
const REFRESH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODU2MDE1MC41ODksImV4cCI6MTc4MDA5NjE1MC41ODksInVuaXF1ZUlkIjoiNGQ4NDBiYzAtZWRlNi00NGZmLTg4OTYtYzUxM2Q2MzBiMzZkIiwidiI6IjIifQ.Zlf5QG0yfXzzC1AtRxjVbQXT04w9oKQckn5d5Q74es5LlNBBSze7h4KZvVhCyo3dWZbBZCDORVTHLq_JaBb-G1R5rdNhCuBfwg8I_vpfZMKslo3pFTqZThLIc04fZJUXs5X1kLAcDPxSA2wqgXaI0Kf3S2KWX_S4Sthm8fhTti5vVriAuuKenG_3zppNAgEhr1Ob0SH5SybXO5Zzo9fl0SVDxpVMSjFuyIfsUmOCbol9VVPzGcuwEFwQCBhuawGFbScxdytvls3enKWt_jN26XtZ5EpJg2kgx6sstjQScaH9fRG4Tz-KSa3wCPPyK4yczFMxqzTsNbonwKM3rZjmRrXXt4KGH5Nmjod3qPwDwJk0tP48DD6-s9ub6U47hO2K1R1zn1bsOy-RY4tKQWmLwvLUSCyIAoJrQlFP7dC3FV-uzmZYfURgHzYKRoY1DTGXGiaDJyO0bJpV-KIwT_4rwMqI3WyJKFgYbkwyZU7usdRTw5ZwBliBcQvGk57Z7DKjGDwx510wza-K9XrchawqYjiVi7APLqB8nJXys1BWuIIZEs2B8YgtR57m6uTxHLULancjWvKzoxlsNMVKO3x6YLHpNRs79t6VFwNzUlUsWHi858Wilp-Scu1XTK5DcrQpn2jE5HTcmkN4YgUJdr4pvyhzKseJNNsbk2JCpqzduxY";

const LOCATION_ID = "GhzkVFpQlXpmPVmjkTr2";

// Get a fresh access token using the refresh token
async function getAccessToken() {
  const now = Date.now();
  if (accessToken && accessTokenExpiresAt > now) return accessToken;

  const { data } = await axios.post("https://services.leadconnectorhq.com/oauth/token", {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: REFRESH_TOKEN,
  }, {
    headers:{
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  accessToken = data.access_token;
  accessTokenExpiresAt = now + 3600 * 1000 - 30000; // buffer of 30s
  return accessToken;
}

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
    const token = await getAccessToken();
    console.log(token);
    const result = await getContact(contactId, token);
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
    const token = await getAccessToken();
    const result = await getContact(contactId, token);

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

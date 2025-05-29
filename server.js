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
const REFRESH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODUzNTU4OS4zNywiZXhwIjoxNzgwMDcxNTg5LjM3LCJ1bmlxdWVJZCI6IjVkOTE3MzczLTBiNWItNDdjMy1iNTQ1LTU0YzdiOGY2Y2EyMiIsInYiOiIyIn0.dM-NPpLbVnfJvXAvq34Q66r_u9qnxoclJdHIBCyUCr_wmWP1SxIjsIRtV-zSAfwmLL0D8ePzJWZdQYxho8NKZrge3QyS5EWnRSsQcCtSXqPvbfsyO3EchCx5KX_78HrsxkBeE6nIJ-ph0WLZwUe0JLTD0KtO_syD7Bl4RqAnHXMaa_ebyBka7ibxD7uEy_d4AMAUzN93NXxtdwXG-dtahcuw9KtvkVukiCcJzg-Ra8m6DouotWHYyoOevuAVjVy6kcx5nBB9owfhVXICZPHkGATvBncgBev1hk7uNQDV6r__R_vHcdypOaIrSfigdY9ToP6Wy-I3oXpIFWECg4ukFmzZH8N7LAsyJP1CwuxNnRskPsnqkU7pe2g27qNMqE0Lj-q-2_E9n8jVppcgnSyWekMwQ36K_7Gy9CX5QTYbuxPkz3OuYGVjYKqKh8BXejxtq8Pf8MftRX2ZYhFju5xCQonHXAGZvJLKONyGsUW-bt5MuzrYVGu-nDmW7rWvuEH0U4P9JrYKnS4bHaJoESe5h1ay5IWVmGaTGl7RD9yEdBFS7uIP2i3dyZ86H7IcZU1x6DLxSGLUVt42r0cFOp_R8EBcEiD_5Dn6NXGS-H8KR-4p_JehmB0qeEc9GhgdwKOGe5JYMSHSXcztZtNBf9tLmChub2oXj83Q4U6QeKy6Y4c";

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

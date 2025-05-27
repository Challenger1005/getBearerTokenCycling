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
const REFRESH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODM3MDQ2Mi4zNjcsImV4cCI6MTc0ODQ1Njg2Mi4zNjd9.a1BPcvugZIzBC5GjOL6bCfpghEog-yhdEfbw0GYHg9_65AVJMVhXj0_G7hb_WSPmcc6aW4bvdZI3gcgrcYVFu_gqllFYke8ipiZSPWYCqnLTO_aQhzXmFFWOp44KMVEaqkQl9h1nr-tfmC788zU5FDR0Qqe7dPSWgvAgrFeEUfWbrsLU_WYlFyPa8i-7XwVo9OfEZs_M5OwRgdr7dmTn3FYGK391UKn3MrTDrLbdQQ9y2n66Kgkc85TFUpDfhN4Hfba4RCeGXcA8QDq6Hnebp1Uu0l78erptOAy3OhuUQJofF1ynuIRoszP8pxeIbeTJNdMVkD4kuPig4d7MpvATmJPJgKf-BoLCJcsGzHSKgU9krrVK5CbXf3S-WkfQd7wkn1zPnxK_pwruZrhEWsIVV9AzWPu2HeNt9ZmtgkE5KZ_Zj0W5v83zkeu7RTbxM9ciAxO9o3-tJ_f87Og0cj9Ml1V3EQ8yvrLPZFREJliFKqlwPYGb4Y9ev62PeF7iBiqsT9YufrmyhN16VdlmtY0msc6if-4hSlZjrC4w9DImcJ3w53MAMuCUlZsdZUufUE8eAG_a4g4NARsDHS_z3IXV8o3loSl0gELFzHT143Tldd3nMNolX0XvU-CAjb4qQp8BX0qnP9AWR-DSikm6Ghw1MMDyzcPKgV5-sVavkJEc9NE";

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
  });

  accessToken = data.access_token;
  accessTokenExpiresAt = now + data.expires_in * 1000 - 30000; // buffer of 30s
  return accessToken;
}

// Retainer API endpoint
app.get("/retainer", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    const token = await getAccessToken();

    const result = await axios.get(`https://services.leadconnectorhq.com/contacts/`, {
      params: { locationId: LOCATION_ID, query: email },
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
      },
    });

    const contact = result.data.contacts?.[0];
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    const retainer = contact.customField?.find(f =>
      f.key.includes("retainer_amount")
    )?.value;

    res.json({ retainer: retainer || "N/A" });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server is running on port", PORT);
});

// index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { google } = require("googleapis");
const fs = require("fs");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());

let accessToken = null;
let accessTokenExpiresAt = 0;

// Your GHL OAuth credentials
const CLIENT_ID = "68326a70642d282656e52d32-mb6t4zus";
const CLIENT_SECRET = "2c23317c-6329-4735-9432-aa951210dec3";
let refresh_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODYxMjMxOS4zMjYsImV4cCI6MTc4MDE0ODMxOS4zMjYsInVuaXF1ZUlkIjoiYTQxZDI4ODgtZjgzMy00M2NiLTgxYjYtMWM4ODgyNjk2YWY0IiwidiI6IjIifQ.Hj661YP-44FNoydeHrwUswlbK63Ys2ICbuSI5WLXHnoMuq9EvtiQam_sEnS1eTBHeMQ9wuN6A2zY4gkS75y9usOYkXkt5Tukvs3i1z-KFum4KgvvbQlPMRPXKzg6_Y6iEX4A6_d36hPZkAoV5zYk_hfSRIdQfuaT3sjbrFtgIVQe6DK5b0HUrVpA6NiOX82J4IMoZVRTbNRtQYi1J5t5HSbvsa6rz88z52wikszZDrqz0zc7FitrZZgvCoiH9_Ozf5O8qRZ_0tOposQw-62E635EKTgFRatu1l5vjtI22pud0N8deqS0MITyyFkbMv05bErZiIXsHESryQp6AGPIivogjG7M8_uiOwUKgB3s1UhoggkBNiqfeuAxi1hHyDna40G6aqAJt9nILfo4Sk6fiCNqw741KtcpRYhM1vYg4Lj04fOSvHh-ZVQoi3xiOJTnIJEcyzUyr4q4B8OucjQcsjGbWbS6xZsWVyipqHEUno1Kn4aLoLn5O8Aix1tJABMQBGHSkQIAnmdIaU-8Aqm7T5ltix-5VHdTJR_a7izy5yp__bmOktXSPftLhWf57ZgGDkYPjdPCM_oXS963RBHxS0aOb6y_0MZU6Fd0lncz_e7rm1nYD0DqozC-PVIIVPSL1h3e3BF-fsQa8ge3UjF3gqkFWs_NjKEPO5RkwsSAOWI";

const LOCATION_ID = "GhzkVFpQlXpmPVmjkTr2";

const oAuth2Client = new google.auth.OAuth2(
  "1087978230353-j8kf0kbtpvmijj93il3ns0i8sb129ee9.apps.googleusercontent.com",
  "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",
  "https://developers.google.com/oauthplayground"
);
// Set your refresh token to get a valid access token
oAuth2Client.setCredentials({ refresh_token: "1//04g9xeg9LJLATCgYIARAAGAQSNwF-L9IrPNDTZamkRcmVGb2qDQgN46algBQxvctkes1qCvJwnUt21OnzWmmfg-kW7Eq67UOkums" });

const drive = google.drive({ version: "v3", auth: oAuth2Client });

app.get('/healthz', (req, res) => {
  res.sendStatus(200);
});
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
setInterval(refreshAccessToken,   3600 * 23 * 1000); // Every 23 hours

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
    await refreshAccessToken();
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
    await refreshAccessToken();
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
// 🔥 UPLOAD endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const driveLink = req.body.google_drive_link;

    // Extract Folder ID from Google Drive link
    const folderId = extractFolderId(driveLink);
    if (!folderId) throw new Error("Invalid Google Drive folder link");

    const fileMetadata = {
      name: file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    fs.unlinkSync(file.path); // Clean up temp file

    res.json({
      success: true,
      fileId: response.data.id,
      link: response.data.webViewLink,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✂️ Utility to extract Folder ID from Google Drive link
function extractFolderId(link) {
  const match = link.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log("✅ Server is running on port", PORT);
});

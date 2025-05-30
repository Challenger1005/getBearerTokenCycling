// index.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

let accessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODYwNTA4My4zNjksImV4cCI6MTc0ODY5MTQ4My4zNjl9.Kur4MTSBLnCMKNB8s90JOB9pliIbVGB1bbFkaVvsCucSH65NSIqbEN4Z7iDXv_nI6B19bK-OoJtxqlsjGcmB0mcETG299JD2nooVPk5lw-s-CjCUXMJmimHI7Rmc_8PsPampJrDBuvyGS7zmPS4sCNGsU6rDYG4AdvlMpDGEFm9uid1bfiRIJraTmA5ZJGKZc7CYDHagjchS88fpkCLamGAuDLPLdOrUxPLhtxfLFqXsCWG0ypq2KMB-qFcRFpYynvMFjtw9L2cmAo3pjQvbMFcVajUl-uLecdxdl_9I1IK_NDqe7DHQfRwVh0VSloJy0oVBCVUPyiJIwzmvRMHj4jdp3xE4HTZdIPmXYcZHg2ls4fbAgzDQOfPbT5ht7UyruuDD2wTjH_gCrszP-lmdGI0umQMh4iq2vtTUZPwLrby02IJXWMkdmkFg5KzxJtZh_JOYhZxYzgL9PgJte5ZgLwV1utAJyOnCDxNppf0m8LCMueqpCmIRjY7XJgBKh6IDClHwGbLUZrsZb3BmdI3gkDXiGzI7D1AITb07fGKBuYSDujebOyFkVbYuoaiOUP_FUmjlMtHxqa6W6uNcBAedVAveFscUsPuzenrkGI-5TUsMKll3Yxs1Hz2sXm9Qcj0vd71Otj4QJJOyfoUzxtO3yJw-7KCxrMjCwtH0nSSdPoA";
let accessTokenExpiresAt = 0;

// Your GHL OAuth credentials
const CLIENT_ID = "68326a70642d282656e52d32-mb6t4zus";
const CLIENT_SECRET = "2c23317c-6329-4735-9432-aa951210dec3";
let refresh_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJMb2NhdGlvbiIsImF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJzb3VyY2UiOiJJTlRFR1JBVElPTiIsInNvdXJjZUlkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIiwiY2hhbm5lbCI6Ik9BVVRIIiwicHJpbWFyeUF1dGhDbGFzc0lkIjoiR2h6a1ZGcFFsWHBtUFZtamtUcjIiLCJvYXV0aE1ldGEiOnsic2NvcGVzIjpbImNvbnRhY3RzLndyaXRlIiwiY29udGFjdHMucmVhZG9ubHkiXSwiY2xpZW50IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwidmVyc2lvbklkIjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyIiwiY2xpZW50S2V5IjoiNjgzMjZhNzA2NDJkMjgyNjU2ZTUyZDMyLW1iNnQ0enVzIn0sImlhdCI6MTc0ODU4ODc1Mi40MzYsImV4cCI6MTc4MDEyNDc1Mi40MzYsInVuaXF1ZUlkIjoiMjkxZjY1MTktMTdkOC00YTIwLTg1NDMtMTA3NjMxMDdkNWRiIiwidiI6IjIifQ.LGht02PSBJDgZ2txkA7K0LPz21XZoaDHMwL5xELl-hz1jJUBg_OULlJWds1F9fbWdXNII393-2AaukrAEuQuhM3bXt5yqh-aVxPj0tq7aWhC7hWQkEUs403dgt111pS31QS2sYh7AA6fow-p8lF7-Ei-Ax7B8ZZZGZuimAkl2IJ4amzGkAc0Pv2HZIhabjxw5GGGoL8TEceQq3VfBvoFl25qFa-C4EQ6BC9fH4RrAxzbETorZ9pF0uhhqrXpgBuIsqaQRgxuSKY04zJkIjSYjxp9SVgUEFY_qtG-N-wYJRGdqcsNwBLexklYGIm3LSCW-ieJvu4dL56BcozaljYidX2KTQLyhGjsF8KwA5MzJywwZRKMlsGSGqYxMx8BW--v5FjkTfwdItrm6819Z3igWE-rBGkh49luNBnt6Rr1S7-ir36dpF_QHRLjUzBlM6gQGjnHrf0nmiowWe4M0z4OZpwFIsQtV246xflo6ZUkjb9REKORuWp6wLvFR-H6RFG8VpFnFihLq8SbFj2Nd5OtGc58Qas_w0lHV-WyOkFensPNVvxIbFz0PUJtoIK1fy2azNGghsD8tKXJbqez9DdfW07Xr82CCJ0F_-_Fr9gHkTN2oRoP0GwTErZDN1Ced3BU9_uDJpYVYThOmCozbKJsDSeiA2-dMpxABfI3nDCU8H0";

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

// refreshAccessToken(); // Immediately on startup
// setInterval(refreshAccessToken,   3600 * 23 * 1000); // Every 30 minutes

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
    //  await refreshAccessToken();
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
    //  await refreshAccessToken();
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

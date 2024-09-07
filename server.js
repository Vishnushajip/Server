const express = require('express');
const twilio = require('twilio');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS if requests are coming from different origins

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// In-memory store for OTPs (for demo purposes; use a database in production)
const otpStore = new Map();

// Endpoint to send OTP
app.post('/send-otp', (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const verificationId = uuidv4();
  const otp = Math.floor(1000 + Math.random() * 9000);

  client.messages.create({
    body: `Your OTP code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  })
  .then(message => {
    otpStore.set(verificationId, { otp, phoneNumber });
    res.status(200).json({ verificationId, message: `OTP sent successfully! Message SID: ${message.sid}` });
  })
  .catch(error => res.status(500).json({ error: 'Failed to send OTP', details: error.message }));
});

// Endpoint to verify OTP
app.post('/verify-otp', (req, res) => {
  const { verificationId, otp } = req.body;

  if (!verificationId || !otp) {
    return res.status(400).json({ error: 'Verification ID and OTP are required' });
  }

  const storedData = otpStore.get(verificationId);

  if (storedData && storedData.otp === parseInt(otp, 10)) {
    otpStore.delete(verificationId);
    res.status(200).json({ message: 'OTP verified successfully!' });
  } else {
    res.status(400).json({ error: 'Invalid OTP or verification ID' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

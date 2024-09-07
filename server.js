const express = require('express');
const twilio = require('twilio');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');


const app = express();
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const otpStore = new Map();

app.post('/send-otp', (req, res) => {
  const { phoneNumber } = req.body;
  const verificationId = uuidv4(); 
  const otp = Math.floor(1000 + Math.random() * 9000);

  client.messages.create({
    body: `Your OTP code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber
  })
  .then(message => {
    otpStore.set(verificationId, { otp, phoneNumber });
    res.status(200).json({ verificationId: verificationId, message: `OTP sent: ${message.sid}` });
  })
  .catch(error => res.status(400).json({ error: error.message }));
});

app.post('/verify-otp', (req, res) => {
  const { verificationId, otp } = req.body;
  const storedData = otpStore.get(verificationId);

  if (storedData && storedData.otp === parseInt(otp, 10)) {
    otpStore.delete(verificationId);
    res.status(200).json({ message: 'OTP verified successfully!' });
  } else {
    res.status(400).json({ error: 'Invalid OTP or verification ID' });
  }
});

  
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

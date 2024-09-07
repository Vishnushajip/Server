const functions = require("firebase-functions");
const twilio = require("twilio");
const {v4: uuidv4} = require("uuid");

const accountSid = functions.config().twilio.sid;
const authToken = functions.config().twilio.token;
const client = twilio(accountSid, authToken);

const otpStore = new Map();

exports.sendOtp = functions.https.onRequest(async (req, res) => {
  const {phoneNumber} = req.body;
  const verificationId = uuidv4();
  const otp = Math.floor(1000 + Math.random() * 9000);

  try {
    await client.messages.create({
      body: `Your OTP code is: ${otp}`,
      from: functions.config().twilio.phone_number,
      to: phoneNumber,
    });

    otpStore.set(verificationId, {otp, phoneNumber});
    res.status(200).json({verificationId, message: "OTP sent successfully!"});
  } catch (error) {
    res.status(400).json({error: error.message});
  }
});

exports.verifyOtp = functions.https.onRequest((req, res) => {
  const {verificationId, otp} = req.body;
  const storedData = otpStore.get(verificationId);

  if (storedData && storedData.otp === parseInt(otp, 10)) {
    otpStore.delete(verificationId);
    res.status(200).json({message: "OTP verified successfully!"});
  } else {
    res.status(400).json({error: "Invalid OTP or verification ID"});
  }
});

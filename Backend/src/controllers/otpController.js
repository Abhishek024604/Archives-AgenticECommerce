import { sendOTPService, verifyOTPService } from "../services/otpService.js";

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    await sendOTPService(email);

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    await verifyOTPService(email, otp);

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
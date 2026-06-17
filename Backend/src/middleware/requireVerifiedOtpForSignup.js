import OTP from "../models/Otp.model.js";
import { normalizeEmail } from "../utils/otpUtils.js";

export const requireVerifiedOtpForSignup = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const record = await OTP.findOne({ email });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP before signing up"
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP"
      });
    }

    if (!record.verified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP before signing up"
      });
    }

    req.body.email = email;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to validate OTP verification"
    });
  }
};

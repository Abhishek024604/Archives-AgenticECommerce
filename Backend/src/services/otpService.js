import OTP from "../models/Otp.model.js";
import User from "../models/User.model.js";
import { generateOTP, hashOTP, normalizeEmail } from "../utils/otpUtils.js";
import { sendOTPEmail } from "../utils/emailSender.js";

export const sendOTPService = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const otp = generateOTP();
  const hashed = hashOTP(otp);

  const expires = new Date(Date.now() + 5 * 60 * 1000);

  await OTP.deleteMany({ email: normalizedEmail });

  await OTP.create({
    email: normalizedEmail,
    otp: hashed,
    expiresAt: expires
  });

  await sendOTPEmail(normalizedEmail, otp);
};

export const verifyOTPService = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otp) {
    throw new Error("Email and OTP are required");
  }

  const record = await OTP.findOne({ email: normalizedEmail });

  if (!record) {
    throw new Error("No OTP found");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  if (record.attempts >= 5) {
    throw new Error("Too many attempts");
  }

  const hashed = hashOTP(otp);

  if (hashed !== record.otp) {
    record.attempts += 1;
    await record.save();
    throw new Error("Invalid OTP");
  }

  record.verified = true;
  await record.save();

  return true;
};

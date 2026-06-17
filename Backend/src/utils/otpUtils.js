import crypto from "crypto";

export const normalizeEmail = (email) => email?.trim().toLowerCase();

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

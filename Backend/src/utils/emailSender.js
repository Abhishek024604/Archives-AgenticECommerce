import nodemailer from "nodemailer";

const getTransporter = () => {
  const user = process.env.EMAIL;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("OTP email service is not configured. Set EMAIL and EMAIL_PASS.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });
};

export const sendOTPEmail = async (email, otp) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Your OTP Code",
    html: `
      <h2>Your OTP is: ${otp}</h2>
      <p>This OTP is valid for 5 minutes.</p>
    `
  });
};

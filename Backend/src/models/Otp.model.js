import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true 
    },
    otp: { 
        type: String, 
        required: true 
    }, // hashed
    expiresAt: { 
        type: Date, 
        required: true },
    attempts: { 
        type: Number, 
        default: 0 },
    verified: { 
        type: Boolean, 
        default: false }
}, { timestamps: true });

export default mongoose.model("OTP", otpSchema);
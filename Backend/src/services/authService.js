import User from "../models/User.model.js"
import OTP from "../models/Otp.model.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js"
import { normalizeEmail } from "../utils/otpUtils.js"

export const signUpService = async (userData) => {
    const { name, email, password, role = "customer", sellerInfo } = userData
    const normalizedEmail = normalizeEmail(email)

    const existingUser = await User.findOne({ email: normalizedEmail })

    if(existingUser){
        throw new Error("User already exists")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUserData = {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role
    }

    if (role === "seller") {
        newUserData.sellerInfo = sellerInfo
    }

    const newUser = await User.create(newUserData)
    await OTP.deleteMany({ email: normalizedEmail })

    const accessToken = generateAccessToken(newUser._id)
    const refreshToken = generateRefreshToken(newUser._id)

    return { newUser, accessToken, refreshToken }
}

export const signInService = async (userData) => {
    const {email, password} = userData
    const normalizedEmail = normalizeEmail(email)

    const foundUser = await User.findOne({ email: normalizedEmail })

    if(!foundUser){
        throw new Error("User not found")
    }

    const isPasswordCorrect = await bcrypt.compare(password, foundUser.password)

    if(!isPasswordCorrect){
        throw new Error("incorect password")
    }

    const accessToken = generateAccessToken(foundUser._id)
    const refreshToken = generateRefreshToken(foundUser._id)

    return { foundUser, accessToken, refreshToken }
}

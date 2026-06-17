import User from "../models/User.model.js";
import { signInService, signUpService } from "../services/authService.js"
import { generateAccessToken } from "../utils/generateTokens.js";
import jwt from "jsonwebtoken"

export const signUp = async (req, res) =>{
    try{
        const { newUser, accessToken, refreshToken } = await signUpService(req.body)
        const { password, ...safeUser } = newUser.toObject()

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000
        })

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            path: "/",
            maxAge: 3 * 60 * 60 * 1000
        })

        res.status(201).json({
            success:true,
            message: "User created and logged in",
            user: safeUser
        })
    } catch(error){
        res.status(400).json({
            success:false,
            message: error.message
        })
    }
};

export const signIn = async (req, res) => {
    try{
       const { foundUser, refreshToken, accessToken } = await signInService(req.body)

       const { password, ...safeUser } = foundUser.toObject()

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 3 * 24 * 60 * 60 * 1000
        })

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            path: "/",
            maxAge: 3 * 60 * 60 * 1000
        })

         res.status(200).json({
            success:true,
            message: "User logged in",
            user: safeUser
        })
    } catch(error){
        res.status(400).json({
            success:false,
            message: error.message
        })
    }
};

export const logout = (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: false
    })

    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: false
    })

    res.status(200).json({
        success:true,
        message: "User logged out"
    })
}

export const checkAuth = async (req, res) =>{
    try {
        const user = await User.findById(req.userId).select("-password")

        res.status(200).json({
            success:true,
            user
        })
    } catch(error){
        res.status(500).json({
            success:false,
            message: "Failed to authenticate user"
        })
    }
}

export const refreshToken = (req, res) =>{
    const token = req.cookies.refreshToken

    if(!token){
        return res.status(401).json({
            success:false,
            message: "Unauthorized. Refresh token missing."
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

        const newAccessToken = generateAccessToken(decoded.userId)

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            path: "/",
            maxAge: 3 * 60 * 60 * 1000
        })

        res.status(200).json({
            success:true
        })

    } catch(error){

        return res.status(403).json({
            message:"Invalid refresh token."
        })
    }
}
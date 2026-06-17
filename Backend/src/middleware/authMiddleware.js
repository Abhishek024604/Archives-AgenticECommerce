import jwt from "jsonwebtoken"
import User from "../models/User.model.js"

export const verifyUser = async (req, res, next) => {
    const token = req.cookies.accessToken

    if(!token){
        return res.status(401).json({
            success:false,
            message: "Access token missing"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
        const user = await User.findById(decoded.userId).select("-password")

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            })
        }

        req.user = user
        req.userId = user._id.toString()
        next()

    } catch(error){

        return res.status(401).json({
            success:false,
            message: "Invalid or expired token"
        })
    }
}

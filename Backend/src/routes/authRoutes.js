import express from "express"
import { checkAuth, logout, refreshToken, signIn, signUp } from "../controllers/authController.js"
import { verifyUser } from "../middleware/authMiddleware.js"
import { requireVerifiedOtpForSignup } from "../middleware/requireVerifiedOtpForSignup.js"

const router = express.Router()

router.post("/signup", requireVerifiedOtpForSignup, signUp)
router.post("/signin", signIn)
router.post("/logout", logout)

router.get("/check-auth", verifyUser, checkAuth)

router.post("/refresh", refreshToken)


export default router

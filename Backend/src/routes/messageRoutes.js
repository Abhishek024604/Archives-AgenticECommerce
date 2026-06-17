import express from "express"
import { verifyUser } from "../middleware/authMiddleware.js"
import { getCommunityMessages } from "../controllers/messageController.js"

const router = express.Router()

router.get("/:communityId", verifyUser, getCommunityMessages)

export default router

// to do : remove verification for user to see community messages
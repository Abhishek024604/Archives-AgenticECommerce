import express from "express"
import { verifyUser } from "../middleware/authMiddleware.js"
import * as communityController from "../controllers/communityController.js"

const router = express.Router()

router.post("/", verifyUser, communityController.createCommunity)
router.post("/join/:id", verifyUser, communityController.joinCommunity)
router.post("/leave/:id", verifyUser, communityController.leaveCommunity)
router.get("/", communityController.getCommunities)

export default router
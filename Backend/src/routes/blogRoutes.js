import express from "express"
import * as blogController from "../controllers/blogController.js"
import { verifyUser } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/", verifyUser, blogController.createBlog)
router.get("/", blogController.getBlogs)
router.get("/:slug", blogController.getBlogBySlug)
router.put("/:id", verifyUser, blogController.updateBlog)
router.delete("/:id", verifyUser, blogController.deleteBlog)

export default router

import express from "express";
import * as productController from "../controllers/productController.js";
import {verifyUser} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyUser, productController.createProduct);
router.get("/", productController.getAllProducts);
router.get("/suggest", productController.getProductSuggestions);
router.get("/:id", productController.getProductById);
router.put("/:id", verifyUser, productController.updateProduct);
router.delete("/:id", verifyUser, productController.deleteProduct);

export default router;

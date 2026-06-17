import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import connectDB from "./config/db.js"

import productRoutes from "./routes/productRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import communityRoutes from "./routes/communityRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"
import cartRoutes from "./routes/cartRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import otpRoutes from "./routes/otpRoutes.js"
import blogRoutes from "./routes/blogRoutes.js"
import lucasRoutes from "./routes/lucasRoutes.js"

import cookieParser from "cookie-parser"

import { Server } from "socket.io"
import registerChatSocket from "./sockets/chat.socket.js"
import { socketAuth } from "./middleware/socketAuthMiddleware.js"



dotenv.config()

connectDB()

const app = express()

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}))

app.use(express.json({ limit: "8mb" }))
app.use(cookieParser())
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

app.use("/api/products", productRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/communities", communityRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes)
app.use("/api/otp", otpRoutes);
app.use("/api/blogs", blogRoutes)
app.use("/api/lucas", lucasRoutes)

app.get("/", (req, res) => {
  res.send("Backend is running")
})

const PORT = process.env.PORT || 5000

// create HTTP server first
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

// attach socket.io to that server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
})

// socket authentication middleware
io.use(socketAuth)

// register chat sockets
registerChatSocket(io)

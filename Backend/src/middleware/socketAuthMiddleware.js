import jwt from "jsonwebtoken"
import cookie from "cookie"

export const socketAuth = (socket, next) => {

  try {

    const cookies = socket.handshake.headers.cookie

    if (!cookies) {
      return next(new Error("No cookies found"))
    }

    const parsedCookies = cookie.parse(cookies)

    const token = parsedCookies.accessToken

    if (!token) {
      return next(new Error("Unauthorized"))
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    )

    socket.userId = decoded.userId

    next()

  } catch (error) {

    next(new Error("Authentication failed"))

  }

}
import { createMessage } from "../services/messageService.js";
import { isCommunityMember } from "../utils/communityAccess.js"

export default function registerChatSocket(io) {
    io.on("connection", (socket) => {
        console.log("user connected", socket.userId)

        socket.on("joinCommunity",(communityId) => {

            socket.join(communityId)
        })

        socket.on("sendMessage", async (data) => {
            try {

                const allowed = await isCommunityMember(
                    data.communityId,
                    socket.userId
                )

                if (!allowed) {
                    return socket.emit("errorMessage", "Access denied")
                }

                const message = await createMessage({
                    communityId: data.communityId,
                    senderId: socket.userId,
                    content: data.content
                })

                io.to(data.communityId).emit("newMessage", message)
            } catch (error) {
                socket.emit("errorMessage", error.message)
            }
        })

        socket.on("disconnect", () => {
            console.log("user disconnected", socket.id)
        })

    })
}
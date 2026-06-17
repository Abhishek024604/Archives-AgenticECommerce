import Message from "../models/Message.model.js";

export const createMessage = async (data) =>{

    if (!data.content?.text && !data.content?.image) {
        throw new Error("Message cannot be empty")
    }

    const message = await Message.create({
        communityId: data.communityId,
        senderId: data.senderId,
        content: data.content
    })

    return await message.populate("senderId", "name profileImage")
}

export const getMessages = async (communityId) => {

    return await Message.find({ communityId })
        .populate("senderId", "name profileImage")
        .sort({ createdAt: 1 })

}

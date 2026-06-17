import Community from "../models/Community.model.js";
import User from "../models/User.model.js";

export  const createCommunity = async (data, userId) =>{

    const existing = await Community.findOne({ name: data.name })

    // to do : early return without submit

    if (existing) {
        throw new Error("Community with this name already exists")
    }

    const community = await Community.create({
        name: data.name,
        description: data.description,
        createdBy: userId,
        members: [userId]
    })

    await User.findByIdAndUpdate(userId, {
        $addToSet: { joinedCommunities: community._id }
    })

    return community
}

export const joinCommunity = async (communityId, userId) =>{

    const community = await Community.findByIdAndUpdate(
        communityId,
        { $addToSet: { members: userId }},
        { new: true }
    )

    if (!community) {
        throw new Error("Community not found")
    }

    community.memberCount = community.members.length
    await community.save()

    await User.findByIdAndUpdate(userId, {
        $addToSet: { joinedCommunities: community._id }
    })

    return community
}

export const leaveCommunity = async (communityId, userId) =>{

    const community = await Community.findByIdAndUpdate(
        communityId,
        { $pull: { members: userId }},
        { new: true }
    )

    if (!community) {
        throw new Error("Community not found")
    }

    community.memberCount = community.members.length
    await community.save()

    await User.findByIdAndUpdate(userId, {
        $pull: { joinedCommunities: community._id }
    })

    return community
}

export const getCommunities = async () => {
    return await Community.find().populate("createdBy", "name").select("name description createdBy members")
}

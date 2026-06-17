import Community from "../models/Community.model.js";

export const isCommunityMember = async (communityId, userId) => {
    const community = await Community.findOne({
        _id: communityId,
        members: userId
    })

    return community
}
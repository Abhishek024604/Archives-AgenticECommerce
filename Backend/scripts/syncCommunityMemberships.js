import dotenv from "dotenv"
import mongoose from "mongoose"
import Community from "../src/models/Community.model.js"
import User from "../src/models/User.model.js"

dotenv.config()

const syncCommunityMemberships = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not set")
    }

    await mongoose.connect(process.env.MONGODB_URI)

    const communities = await Community.find().select("_id members")
    await User.updateMany({}, { $set: { joinedCommunities: [] } })

    let membershipsSynced = 0

    for (const community of communities) {
        const memberIds = [...new Set((community.members || []).map((member) => member.toString()))]

        community.memberCount = memberIds.length
        await community.save()

        if (memberIds.length === 0) {
            continue
        }

        const result = await User.updateMany(
            { _id: { $in: memberIds } },
            { $addToSet: { joinedCommunities: community._id } }
        )

        membershipsSynced += result.modifiedCount
    }

    console.log(JSON.stringify({
        communitiesChecked: communities.length,
        userCommunityLinksSynced: membershipsSynced
    }, null, 2))
}

syncCommunityMemberships()
    .catch((error) => {
        console.error(error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })

import Community from "../models/Community.model.js";
import User from "../models/User.model.js";

export const createCommunity = async (data, userId) => {
  const existing = await Community.findOne({ name: data.name });

  if (existing) {
    throw new Error("Community with this name already exists");
  }

  const community = await Community.create({
    name: data.name,
    description: data.description,
    category: data.category || "Fashion",
    communityImage: data.communityImage || "",
    createdBy: userId,
    members: [userId]
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: { joinedCommunities: community._id }
  });

  return community;
};

export const joinCommunity = async (communityId, userId) => {
  const community = await Community.findByIdAndUpdate(
    communityId,
    { $addToSet: { members: userId } },
    { new: true }
  );

  if (!community) {
    throw new Error("Community not found");
  }

  community.memberCount = community.members.length;
  await community.save();

  await User.findByIdAndUpdate(userId, {
    $addToSet: { joinedCommunities: community._id }
  });

  return community;
};

export const leaveCommunity = async (communityId, userId) => {
  const community = await Community.findByIdAndUpdate(
    communityId,
    { $pull: { members: userId } },
    { new: true }
  );

  if (!community) {
    throw new Error("Community not found");
  }

  community.memberCount = community.members.length;
  await community.save();

  await User.findByIdAndUpdate(userId, {
    $pull: { joinedCommunities: community._id }
  });

  return community;
};

export const getCommunities = async (searchQuery = "") => {
  const query = String(searchQuery || "").trim();

  if (query) {
    try {
      const communities = await Community.aggregate([
        {
          $search: {
            index: "community_search",
            compound: {
              should: [
                {
                  autocomplete: {
                    query,
                    path: "name",
                    fuzzy: { maxEdits: 1 },
                    score: { boost: { value: 5 } }
                  }
                },
                {
                  text: {
                    query,
                    path: "description",
                    fuzzy: { maxEdits: 1 }
                  }
                }
              ],
              minimumShouldMatch: 1
            }
          }
        },
        {
           $lookup: {
             from: "users",
             localField: "createdBy",
             foreignField: "_id",
             as: "createdBy"
           }
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
        {
           $project: {
             name: 1,
             description: 1,
             category: 1,
             communityImage: 1,
             "createdBy.name": 1,
             "createdBy._id": 1,
             members: 1,
             memberCount: 1,
             searchScore: { $meta: "searchScore" }
           }
        },
        { $sort: { searchScore: -1 } }
      ]);
      
      if (communities.length === 0) {
        // Fallback for newly created communities not yet indexed
        const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return await Community.find({
          $or: [{ name: pattern }, { description: pattern }]
        })
          .populate("createdBy", "name")
          .select("name description category communityImage createdBy members memberCount");
      }
      
      // Mongo aggregates don't run Mongoose getters by default, 
      // but for basic returning of data, returning the array is fine.
      return communities;
    } catch (e) {
      // Fallback
      const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      return await Community.find({
        $or: [{ name: pattern }, { description: pattern }]
      })
        .populate("createdBy", "name")
        .select("name description category communityImage createdBy members memberCount");
    }
  }

  return await Community.find()
    .populate("createdBy", "name")
    .select("name description category communityImage createdBy members memberCount");
};

export const deleteCommunity = async (communityId, userId) => {
  const community = await Community.findById(communityId);
  if (!community) {
    throw new Error("Community not found");
  }

  if (community.createdBy.toString() !== userId.toString()) {
    throw new Error("Unauthorized to delete community");
  }

  await Community.findByIdAndDelete(communityId);
  return true;
};


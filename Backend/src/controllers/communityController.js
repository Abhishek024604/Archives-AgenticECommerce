import * as communityService from "../services/communityService.js";

export const createCommunity = async (req, res) =>{

    try{
        const community = await communityService.createCommunity(
            req.body,
            req.userId
        )

        res.status(201).json({
            success:true,
            community
        })
    } catch(error){

        res.status(400).json({
            success:false,
            message: error.message
        })
    }
}

export const joinCommunity = async (req, res) =>{

    try{
        const community = await communityService.joinCommunity(
            req.params.id,
            req.userId
        )

        res.status(200).json({
            success:true,
            community
        })
    } catch(error){

        res.status(400).json({
            success:false,
            message: error.message
        })
    }
}

export const leaveCommunity = async (req, res) => {

    try {

        const community = await communityService.leaveCommunity(
            req.params.id,
            req.userId
        )

        res.status(200).json({
            success: true,
            community
        })

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

export const getCommunities = async (req, res) => {

    try {

        const communities = await communityService.getCommunities()

        res.status(200).json({
            success: true,
            communities
        })

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


import * as messageService from "../services/messageService.js"

export const getCommunityMessages = async (req, res) =>{
    try{

        const messages = await messageService.getMessages(req.params.communityId)

        res.status(200).json({
            success:true,
            messages
        })
    }  catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
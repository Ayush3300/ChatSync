import User from "../models/user.model.js"
import Message from "../models/message.model.js"
import cloudinary from "../lib/cloudinary.js"
import { getReceiverSocketId ,io} from "../lib/socket.js"

export const getUsersForSidebar = async (req,res)=>{
    try {
        const loggedInUser = await User.findById(req.user._id).populate("friends", "-password")
        const friends = loggedInUser.friends

        // For each friend, find the timestamp of the last message between them and the logged-in user
        const friendsWithLastMsg = await Promise.all(
            friends.map(async (friend) => {
                const lastMessage = await Message.findOne({
                    $or: [
                        { senderId: req.user._id, receiverId: friend._id },
                        { senderId: friend._id, receiverId: req.user._id },
                    ],
                })
                    .sort({ createdAt: -1 })
                    .select("createdAt text image senderId")
                    .lean()

                return {
                    ...friend.toJSON(),
                    lastMessageAt: lastMessage ? lastMessage.createdAt : null,
                    lastMessageText: lastMessage?.text || null,
                    lastMessageIsImage: lastMessage?.image ? true : false,
                    lastMessageSenderId: lastMessage?.senderId || null,
                }
            })
        )

        // Sort: most recent message first, friends with no messages go to the bottom
        friendsWithLastMsg.sort((a, b) => {
            if (!a.lastMessageAt && !b.lastMessageAt) return 0
            if (!a.lastMessageAt) return 1
            if (!b.lastMessageAt) return -1
            return new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        })

        res.status(200).json(friendsWithLastMsg)
    } catch (error) {
        console.error("Error in getUsersForSidebar: ",error.message)
        res.status(500).json({error : "Internal server error"})
    }
}

export const getMessages = async(req,res)=>{
    try {
        const {id:userToChatId} = req.params
        const myId = req.user._id

        const messages = await Message.find({
            $or : [
                {senderId : myId , receiverId:userToChatId},
                {senderId:userToChatId , receiverId:myId}
            ]
        })

        res.status(200).json(messages)
    } catch (error) {
        console.log("Error in getMessages controller ", error.message)
        res.status(500).json({error : "Internal server error"})
    }
}

export const sendMessage = async (req,res)=>{
    try {
        const {text , image} = req.body
        const {id : receiverId} = req.params
        const senderId = req.user._id

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl
        })

        await newMessage.save()

        const receiverSocketId = getReceiverSocketId(receiverId)
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage)
        }

        res.status(201).json(newMessage)

    } catch (error) {
        console.log("Error in sendMessage controller : ", error.message)
        res.status(500).json({error:"Internal server error"})
    }
}
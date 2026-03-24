import FriendRequest from "../models/friendRequest.model.js"
import User from "../models/user.model.js"
import { getReceiverSocketId, io } from "../lib/socket.js"

// Search users by username (prefix match, excludes self)
export const searchUsers = async (req, res) => {
    try {
        const { username } = req.query
        if (!username || !username.trim()) {
            return res.status(400).json({ message: "Username query is required" })
        }

        const users = await User.find({
            _id: { $ne: req.user._id },
            username: { $regex: `^${username.trim().toLowerCase()}`, $options: "i" }
        })
            .select("fullName username profilePic")
            .limit(10)

        res.status(200).json(users)
    } catch (error) {
        console.log("Error in searchUsers: ", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

// Send a friend request
export const sendRequest = async (req, res) => {
    try {
        const { userId } = req.params
        const senderId = req.user._id

        if (senderId.toString() === userId) {
            return res.status(400).json({ message: "You cannot send a request to yourself" })
        }

        // Check if they are already friends
        const sender = await User.findById(senderId)
        if (sender.friends.includes(userId)) {
            return res.status(400).json({ message: "You are already friends" })
        }

        // Check if a request already exists in either direction
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: userId },
                { sender: userId, receiver: senderId }
            ],
            status: { $in: ["pending", "accepted"] }
        })

        if (existingRequest) {
            if (existingRequest.status === "accepted") {
                return res.status(400).json({ message: "You are already friends" })
            }
            return res.status(400).json({ message: "A friend request already exists" })
        }

        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: userId
        })
        await newRequest.save()

        // Populate sender info for the real-time notification
        const populatedRequest = await FriendRequest.findById(newRequest._id)
            .populate("sender", "fullName username profilePic")
            .populate("receiver", "fullName username profilePic")

        // Real-time notification to receiver
        const receiverSocketId = getReceiverSocketId(userId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("friendRequestReceived", populatedRequest)
        }

        res.status(201).json(populatedRequest)
    } catch (error) {
        console.log("Error in sendRequest: ", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

// Accept a friend request
export const acceptRequest = async (req, res) => {
    try {
        const { requestId } = req.params
        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(404).json({ message: "Request not found" })
        }

        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" })
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Request is no longer pending" })
        }

        // Update request status
        request.status = "accepted"
        await request.save()

        // Add each user to the other's friends list
        await User.findByIdAndUpdate(request.sender, {
            $addToSet: { friends: request.receiver }
        })
        await User.findByIdAndUpdate(request.receiver, {
            $addToSet: { friends: request.sender }
        })

        // Get the updated friend data to send back
        const newFriend = await User.findById(request.sender).select("-password")

        // Notify the original sender that their request was accepted
        const senderSocketId = getReceiverSocketId(request.sender.toString())
        if (senderSocketId) {
            const acceptedByUser = await User.findById(request.receiver).select("-password")
            io.to(senderSocketId).emit("friendRequestAccepted", {
                request,
                friend: acceptedByUser
            })
        }

        res.status(200).json({ request, friend: newFriend })
    } catch (error) {
        console.log("Error in acceptRequest: ", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

// Reject a friend request
export const rejectRequest = async (req, res) => {
    try {
        const { requestId } = req.params
        const request = await FriendRequest.findById(requestId)

        if (!request) {
            return res.status(404).json({ message: "Request not found" })
        }

        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" })
        }

        if (request.status !== "pending") {
            return res.status(400).json({ message: "Request is no longer pending" })
        }

        request.status = "rejected"
        await request.save()

        res.status(200).json({ message: "Request rejected" })
    } catch (error) {
        console.log("Error in rejectRequest: ", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

// Get incoming pending requests
export const getPendingRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: "pending"
        }).populate("sender", "fullName username profilePic")

        res.status(200).json(requests)
    } catch (error) {
        console.log("Error in getPendingRequests: ", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

// Get outgoing sent requests
export const getSentRequests = async (req, res) => {
    try {
        const requests = await FriendRequest.find({
            sender: req.user._id,
            status: "pending"
        }).populate("receiver", "fullName username profilePic")

        res.status(200).json(requests)
    } catch (error) {
        console.log("Error in getSentRequests: ", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

// Get current user's friends list
export const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("friends", "fullName username profilePic")

        res.status(200).json(user.friends)
    } catch (error) {
        console.log("Error in getFriends: ", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

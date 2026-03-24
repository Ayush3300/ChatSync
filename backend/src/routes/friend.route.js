import express from "express"
import { protectRoute } from "../middleware/auth.middleware.js"
import {
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    getPendingRequests,
    getSentRequests,
    getFriends
} from "../controllers/friend.controller.js"

const router = express.Router()

router.get("/search", protectRoute, searchUsers)
router.get("/pending", protectRoute, getPendingRequests)
router.get("/sent", protectRoute, getSentRequests)
router.get("/list", protectRoute, getFriends)

router.post("/send/:userId", protectRoute, sendRequest)
router.put("/accept/:requestId", protectRoute, acceptRequest)
router.put("/reject/:requestId", protectRoute, rejectRequest)

export default router

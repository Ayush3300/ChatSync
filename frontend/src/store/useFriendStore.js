import { create } from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"

export const useFriendStore = create((set, get) => ({
    searchResults: [],
    pendingRequests: [],
    sentRequests: [],
    isSearching: false,
    isLoadingRequests: false,

    searchUsers: async (username) => {
        if (!username.trim()) {
            set({ searchResults: [] })
            return
        }
        set({ isSearching: true })
        try {
            const res = await axiosInstance.get(`/friends/search?username=${username}`)
            set({ searchResults: res.data })
        } catch (error) {
            toast.error(error.response?.data?.message || "Search failed")
        } finally {
            set({ isSearching: false })
        }
    },

    sendRequest: async (userId) => {
        try {
            await axiosInstance.post(`/friends/send/${userId}`)
            toast.success("Friend request sent!")
            // Refresh sent requests
            get().getSentRequests()
            // Remove from search results
            set({
                searchResults: get().searchResults.filter(u => u._id !== userId)
            })
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send request")
        }
    },

    acceptRequest: async (requestId) => {
        try {
            const res = await axiosInstance.put(`/friends/accept/${requestId}`)
            toast.success("Friend request accepted!")
            // Remove from pending
            set({
                pendingRequests: get().pendingRequests.filter(r => r._id !== requestId)
            })
            return res.data.friend
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept request")
        }
    },

    rejectRequest: async (requestId) => {
        try {
            await axiosInstance.put(`/friends/reject/${requestId}`)
            toast.success("Friend request rejected")
            set({
                pendingRequests: get().pendingRequests.filter(r => r._id !== requestId)
            })
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject request")
        }
    },

    getPendingRequests: async () => {
        set({ isLoadingRequests: true })
        try {
            const res = await axiosInstance.get("/friends/pending")
            set({ pendingRequests: res.data })
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load requests")
        } finally {
            set({ isLoadingRequests: false })
        }
    },

    getSentRequests: async () => {
        try {
            const res = await axiosInstance.get("/friends/sent")
            set({ sentRequests: res.data })
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to load sent requests")
        }
    },

    clearSearch: () => {
        set({ searchResults: [] })
    },

    // Called when a real-time friend request is received via socket
    addIncomingRequest: (request) => {
        const existing = get().pendingRequests.find(r => r._id === request._id)
        if (!existing) {
            set({ pendingRequests: [...get().pendingRequests, request] })
        }
    },

    // Called when a sent request is accepted via socket
    removeFromSent: (requestId) => {
        set({
            sentRequests: get().sentRequests.filter(r => r._id !== requestId)
        })
    }
}))

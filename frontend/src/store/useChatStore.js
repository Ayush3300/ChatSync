import {create} from "zustand"
import toast from "react-hot-toast"
import { axiosInstance } from "../lib/axios"
import { useAuthStore } from "./useAuthStore"

export const useChatStore = create ((set,get)=>({
    messages:[],
    users:[],
    selectedUser : null,
    isUsersLoading:false,
    isMessagesLoading:false,
    unreadCounts: {}, // { [senderId]: count }

    getUsers: async()=>{
        set({isUsersLoading:true})
        try {
            const res = await axiosInstance.get("/messages/users")
            set({users:res.data})
        } catch (error) {
            toast.error(error.response.data.message)
        } finally{
            set({isUsersLoading:false})
        }
    },

    getMessages: async(userId)=>{
        set({isMessagesLoading:true})
        try {
            const res = await axiosInstance.get(`/messages/${userId}`)
            set({messages:res.data})
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({isMessagesLoading : false})
        }
    },

    sendMessage : async(messageData)=>{
        const {selectedUser , messages}= get()
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`,messageData)
            set({messages : [...messages,res.data]})

            // Move selected user to top of sidebar + update preview
            const currentUsers = get().users;
            const updated = currentUsers.map(u => 
                u._id === selectedUser._id 
                    ? {
                        ...u,
                        lastMessageAt: res.data.createdAt,
                        lastMessageText: res.data.text || null,
                        lastMessageIsImage: !!res.data.image,
                        lastMessageSenderId: res.data.senderId,
                    }
                    : u
            );

            // Sort: most recent message first
            updated.sort((a, b) => {
                if (!a.lastMessageAt && !b.lastMessageAt) return 0;
                if (!a.lastMessageAt) return 1;
                if (!b.lastMessageAt) return -1;
                return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
            });

            set({ users: updated })
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },



    setSelectedUser : (selectedUser)=>{
        // clear unread count for the user being opened
        if(selectedUser){
            const prev = get().unreadCounts
            const updated = { ...prev }
            delete updated[selectedUser._id]
            set({ selectedUser, unreadCounts: updated })
        } else {
            set({ selectedUser })
        }
    },
}))
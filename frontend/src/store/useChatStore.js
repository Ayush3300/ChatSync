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

            // Move selected user to top of sidebar
            const currentUsers = get().users
            const idx = currentUsers.findIndex(u => u._id === selectedUser._id)
            if (idx > 0) {
                const updated = [...currentUsers]
                const [user] = updated.splice(idx, 1)
                updated.unshift(user)
                set({ users: updated })
            }
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    subscribeToMessages: ()=>{
        const {selectedUser} = get()
        if(!selectedUser) return

        const socket = useAuthStore.getState().socket

        socket.on("newMessage",(newMessage)=>{
            const isFromSelectedUser = newMessage.senderId === selectedUser._id
            if(isFromSelectedUser){
                // message is from currently open chat — show it directly
                set({ messages : [...get().messages, newMessage] })
            } else {
                // message from background contact — increment unread badge
                const prev = get().unreadCounts
                set({ unreadCounts: { ...prev, [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1 } })
            }

            // Move the message sender to the top of sidebar
            const currentUsers = get().users
            const senderId = newMessage.senderId
            const senderIndex = currentUsers.findIndex(u => u._id === senderId)
            if (senderIndex > 0) {
                const updated = [...currentUsers]
                const [sender] = updated.splice(senderIndex, 1)
                updated.unshift(sender)
                set({ users: updated })
            }
        })
    },

    unsubscribeFromMessages : ()=>{
        const socket = useAuthStore.getState().socket
        socket.off("newMessage")
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
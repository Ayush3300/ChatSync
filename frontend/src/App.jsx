import Navbar from "./components/Navbar"
import {Routes , Route , Navigate} from "react-router-dom"
import HomePage from "./pages/HomePage.jsx"
import SignUpPage from "./pages/SignUpPage.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import SettingsPage from "./pages/SettingsPage.jsx"
import ProfilePage from "./pages/ProfilePage.jsx"
import { useAuthStore } from "./store/useAuthStore.js"
import { useFriendStore } from "./store/useFriendStore.js"
import { useChatStore } from "./store/useChatStore.js"
import { useThemeStore } from "./store/useThemeStore.js"
import { useEffect } from "react"
import {Loader} from "lucide-react"

import {Toaster} from "react-hot-toast"
import toast from "react-hot-toast"

// Global message listener — runs ALWAYS when socket is connected
// so unread counts work even when no chat is open
function useGlobalMessageListener() {
  const socket = useAuthStore((s) => s.socket)

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (newMessage) => {
      const selectedUser = useChatStore.getState().selectedUser
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        // Message is from the currently open chat — append it
        useChatStore.setState({
          messages: [...useChatStore.getState().messages, newMessage]
        })
      } else {
        // Message from someone else — increment unread badge
        const prev = useChatStore.getState().unreadCounts
        useChatStore.setState({
          unreadCounts: {
            ...prev,
            [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
          }
        })
      }
    }

    socket.on("newMessage", handleNewMessage)
    return () => socket.off("newMessage", handleNewMessage)
  }, [socket])
}

const App = ()=>{
  const {authUser,checkAuth,isCheckingAuth, socket} = useAuthStore()
  const {theme} = useThemeStore()

  // Always listen for new messages (handles unread counts globally)
  useGlobalMessageListener()

  useEffect(()=>{
    checkAuth()
  } , [checkAuth])

  // Listen for friend request socket events
  useEffect(() => {
    if (!socket) return

    const handleFriendRequestReceived = (request) => {
      useFriendStore.getState().addIncomingRequest(request)
      toast.success(`${request.sender.fullName} sent you a friend request!`)
    }

    const handleFriendRequestAccepted = ({ request, friend }) => {
      useFriendStore.getState().removeFromSent(request._id)
      // Add accepted friend to the sidebar users list
      const currentUsers = useChatStore.getState().users
      const alreadyExists = currentUsers.find(u => u._id === friend._id)
      if (!alreadyExists) {
        useChatStore.setState({ users: [...currentUsers, friend] })
      }
      toast.success(`${friend.fullName} accepted your friend request!`)
    }

    socket.on("friendRequestReceived", handleFriendRequestReceived)
    socket.on("friendRequestAccepted", handleFriendRequestAccepted)

    return () => {
      socket.off("friendRequestReceived", handleFriendRequestReceived)
      socket.off("friendRequestAccepted", handleFriendRequestAccepted)
    }
  }, [socket])

  if(isCheckingAuth) return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="size-10 animate-spin" />
    </div>
  )

  return (
    <div >
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login"/>} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/"/>} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/"/>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login"/>} />
      </Routes>
      <Toaster />
    </div>
  )
}
export default App
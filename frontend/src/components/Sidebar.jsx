import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, UserPlus, UserCheck, X, Clock, Check, Loader2 } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadCounts } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const {
    searchResults,
    pendingRequests,
    sentRequests,
    isSearching,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    getPendingRequests,
    getSentRequests,
    clearSearch,
  } = useFriendStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats"); // "chats" | "search" | "requests"

  useEffect(() => {
    getUsers();
    getPendingRequests();
    getSentRequests();
  }, [getUsers, getPendingRequests, getSentRequests]);

  // Debounced search
  useEffect(() => {
    if (activeTab !== "search") return;
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        clearSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Check if user already has a pending sent request
  const hasSentRequest = (userId) => {
    return sentRequests.some(r => r.receiver?._id === userId || r.receiver === userId);
  };

  // Check if user is already a friend
  const isFriend = (userId) => {
    return users.some(u => u._id === userId);
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Tabs */}
      <div className="border-b border-base-300 w-full p-3">
        <div className="flex items-center gap-1 justify-center lg:justify-start">
          <button
            onClick={() => setActiveTab("chats")}
            className={`btn btn-sm btn-ghost gap-1 ${activeTab === "chats" ? "btn-active" : ""}`}
            title="Chats"
          >
            <Users className="size-4" />
            <span className="hidden lg:inline">Chats</span>
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`btn btn-sm btn-ghost gap-1 ${activeTab === "search" ? "btn-active" : ""}`}
            title="Find People"
          >
            <Search className="size-4" />
            <span className="hidden lg:inline">Find</span>
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`btn btn-sm btn-ghost gap-1 relative ${activeTab === "requests" ? "btn-active" : ""}`}
            title="Requests"
          >
            <UserPlus className="size-4" />
            <span className="hidden lg:inline">Requests</span>
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold
                rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 text-[10px]">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="overflow-y-auto w-full flex-1">

        {/* ===== CHATS TAB ===== */}
        {activeTab === "chats" && (
          <>
            <div className="py-2">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`
                    w-full p-3 flex items-center gap-3
                    hover:bg-base-300 transition-colors
                    ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                  `}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                        rounded-full ring-2 ring-zinc-900"
                      />
                    )}
                    {/* Unread message badge */}
                    {unreadCounts[user._id] > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold
                        rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCounts[user._id] > 99 ? "99+" : unreadCounts[user._id]}
                      </span>
                    )}
                  </div>

                  {/* User info - only visible on larger screens */}
                  <div className="hidden lg:block text-left min-w-0">
                    <div className="font-medium truncate">{user.fullName}</div>
                    <div className="text-sm text-zinc-400">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              ))}

              {users.length === 0 && (
                <div className="text-center text-zinc-500 py-8 px-4">
                  <UserPlus className="size-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No friends yet</p>
                  <p className="text-xs mt-1 hidden lg:block">Search for users by username to add friends!</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== SEARCH TAB ===== */}
        {activeTab === "search" && (
          <div className="p-3">
            {/* Search input */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search by username..."
                className="input input-bordered input-sm w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => { setSearchQuery(""); clearSearch(); }}
                >
                  <X className="size-4 text-zinc-400" />
                </button>
              )}
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-zinc-400" />
              </div>
            )}

            {!isSearching && searchResults.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300 transition-colors"
              >
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-10 object-cover rounded-full"
                />
                <div className="flex-1 min-w-0 hidden lg:block">
                  <div className="font-medium text-sm truncate">{user.fullName}</div>
                  <div className="text-xs text-zinc-400">@{user.username}</div>
                </div>
                {isFriend(user._id) ? (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <UserCheck className="size-3" />
                    <span className="hidden lg:inline">Friends</span>
                  </span>
                ) : hasSentRequest(user._id) ? (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="size-3" />
                    <span className="hidden lg:inline">Pending</span>
                  </span>
                ) : (
                  <button
                    onClick={() => sendRequest(user._id)}
                    className="btn btn-xs btn-primary gap-1"
                    title="Send Request"
                  >
                    <UserPlus className="size-3" />
                    <span className="hidden lg:inline">Add</span>
                  </button>
                )}
              </div>
            ))}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <div className="text-center text-zinc-500 py-4 text-sm">
                No users found
              </div>
            )}

            {!searchQuery && (
              <div className="text-center text-zinc-500 py-8">
                <Search className="size-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm hidden lg:block">Search for users by username</p>
              </div>
            )}
          </div>
        )}

        {/* ===== REQUESTS TAB ===== */}
        {activeTab === "requests" && (
          <div className="p-3">
            {/* Incoming Requests */}
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 hidden lg:block">
              Incoming Requests
            </h3>

            {pendingRequests.length === 0 && (
              <div className="text-center text-zinc-500 py-4 text-sm hidden lg:block">
                No pending requests
              </div>
            )}

            {pendingRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300 transition-colors mb-1"
              >
                <img
                  src={request.sender?.profilePic || "/avatar.png"}
                  alt={request.sender?.fullName}
                  className="size-10 object-cover rounded-full"
                />
                <div className="flex-1 min-w-0 hidden lg:block">
                  <div className="font-medium text-sm truncate">{request.sender?.fullName}</div>
                  <div className="text-xs text-zinc-400">@{request.sender?.username}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={async () => {
                      const friend = await acceptRequest(request._id);
                      if (friend) {
                        // Refresh the sidebar users list
                        getUsers();
                      }
                    }}
                    className="btn btn-xs btn-success btn-circle"
                    title="Accept"
                  >
                    <Check className="size-3" />
                  </button>
                  <button
                    onClick={() => rejectRequest(request._id)}
                    className="btn btn-xs btn-error btn-circle"
                    title="Reject"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Sent Requests */}
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 mt-4 hidden lg:block">
              Sent Requests
            </h3>

            {sentRequests.length === 0 && (
              <div className="text-center text-zinc-500 py-4 text-sm hidden lg:block">
                No sent requests
              </div>
            )}

            {sentRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-300 transition-colors mb-1"
              >
                <img
                  src={request.receiver?.profilePic || "/avatar.png"}
                  alt={request.receiver?.fullName}
                  className="size-10 object-cover rounded-full"
                />
                <div className="flex-1 min-w-0 hidden lg:block">
                  <div className="font-medium text-sm truncate">{request.receiver?.fullName}</div>
                  <div className="text-xs text-zinc-400">@{request.receiver?.username}</div>
                </div>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Clock className="size-3" />
                  <span className="hidden lg:inline">Pending</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
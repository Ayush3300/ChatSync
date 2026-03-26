const friendsWithLastMsg = [
    { name: 'A', lastMessageAt: '2023-01-01T00:00:00Z' }, // oldest
    { name: 'B', lastMessageAt: '2023-01-03T00:00:00Z' }, // newest
    { name: 'C', lastMessageAt: null }, // no msg
    { name: 'D', lastMessageAt: '2023-01-02T00:00:00Z' }  // middle
];

friendsWithLastMsg.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0
    if (!a.lastMessageAt) return 1
    if (!b.lastMessageAt) return -1
    return new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
})

console.log(friendsWithLastMsg);

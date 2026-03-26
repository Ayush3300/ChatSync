const users = [
    { _id: '1', name: 'Alice', lastMessageAt: '2023-01-01T00:00:00Z' },
    { _id: '2', name: 'Bob', lastMessageAt: '2023-01-02T00:00:00Z' },
    { _id: '3', name: 'Charlie', lastMessageAt: '2023-01-03T00:00:00Z' }
];

const selectedUser = { _id: '2' };
const resData = {
    createdAt: '2023-01-04T00:00:00Z',
    text: 'Hello!',
    image: null,
    senderId: 'Me'
};

const idx = users.findIndex(u => u._id === selectedUser._id);
const updated = [...users];
const targetIdx = idx === -1 ? 0 : idx;
const [user] = updated.splice(targetIdx, 1);
updated.unshift({
    ...user,
    lastMessageAt: resData.createdAt,
    lastMessageText: resData.text || null,
    lastMessageIsImage: !!resData.image,
    lastMessageSenderId: resData.senderId,
});

console.log(updated);

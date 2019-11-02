const io = require('../app').io;
let connectedUsers = {};
let playerWait = {};
const { createUser, createMessage, createChat } = require('./Factories');
let communityChat = createChat()

module.exports = function (socket) {
    console.log("Socket Id: " + socket.id);
    let sendMessageToChatFromUser;
    //VERIFY_USER
    socket.on("VERIFY_USER", (nickname, callback) => {
        if (isUser(connectedUsers, nickname)) {
            callback({ isUser: true, user: null })
        }
        else {
            callback({ isUser: false, user: createUser({ name: nickname, socketId: socket.id }) })
            // addUser(connectedUsers,nickname)
        }
    })
    //USER_CONNECTED
    socket.on("USER_CONNECTED", (user) => {
        connectedUsers = addUser(connectedUsers, user);
        user.socketId = socket.id
        socket.user = user;
        // console.log(io);
        sendMessageToChatFromUser = sendMessageToChat(user.name);
        io.emit("USER_CONNECTED", connectedUsers)
        console.log(connectedUsers);
    })
    //COMMUNITY_CHAT
    socket.on("COMMUNITY_CHAT", function (callback) {
        console.log("Connect communityChat");
        callback(communityChat)
    })
    //disconnect
    socket.on("disconnect", () => {
        if ("user" in socket) {
            connectedUsers = removeUser(connectedUsers, socket.user.name)
            io.emit("USER_DISCONNECTED", connectedUsers);
            if (socket.user.name == playerWait.name)
                playerWait = {};    
            console.log("After Disconnecting: ", connectedUsers);
        }
    })
    //LOGOUT
    socket.on("LOGOUT", () => {
        connectedUsers = removeUser(connectedUsers, socket.user.name)
        io.emit("USER_DISCONNECTED", connectedUsers);
        console.log("After Logout: ", connectedUsers);
    })
    //MESSAGE_SENT
    socket.on("MESSAGE_SENT", ({ chatId, message }) => {
        sendMessageToChatFromUser(chatId, message);
    })
    //PRIVATE_MESSAGE
    socket.on("PRIVATE_MESSAGE", ({ reciever, sender }) => {
        if (reciever in connectedUsers) {

            const newChat = createChat({ name: `${reciever}&${sender}`, users: [reciever, sender] })
            const recieverSocket = connectedUsers[reciever].socketId;
            console.log('connectedUsers[reciever]:', connectedUsers[reciever]);
            // console.log('recieverSocket:', recieverSocket)
            socket.to(recieverSocket).emit("PRIVATE_MESSAGE", newChat);
            socket.emit("PRIVATE_MESSAGE", newChat);
        }
    })
    //FIND_GAME
    socket.on("FIND_GAME", ({ user }) => {
        // console.log('user:', user);

        if (user.name in connectedUsers) {
            console.log(typeof (playerWait.name) == "undefined");
            if (typeof(playerWait.name) == "undefined") {
                user.socketId = socket.id
                playerWait = user;
                console.log('playerWait:', playerWait);
            }
            else {
                const newChat = createChat({ name: `${user.name} VS ${playerWait.name}`, users: [playerWait, user] })
                socket.to(playerWait.socketId).emit("FIND_GAME", newChat);
                socket.emit("FIND_GAME", newChat);
                playerWait = {};
                console.log('playerWait:', playerWait);
            }
        }
    })
}
function addUser(userList, user) {
    let newList = Object.assign({}, userList);
    newList[user.name] = user;
    return newList
}
function removeUser(userlist, username) {
    let newList = Object.assign({}, userlist);
    delete newList[username];
    return newList
}
function isUser(userList, username) {
    return username in userList
}

function sendMessageToChat(sender) {
    return (chatId, message) => {
        console.log("MESSAGE_RECIEVED-" + chatId);
        io.emit("MESSAGE_RECIEVED-" + chatId, createMessage({ message, sender }));
    }
}
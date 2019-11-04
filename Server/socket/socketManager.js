const io = require('../app').io;
var _ = require('lodash');
let connectedUsers = {};
let playerWait = {};
const { createUser, createMessage, createChat } = require('./Factories');
let communityChat = createChat()
let roomsPlay = [];
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
        console.log('user in Find Game:', user);

        if (user.name in connectedUsers) {

            if (typeof (playerWait.name) == "undefined") {
                user.socketId = socket.id
                playerWait = user;
            }
            else {
                user.socketId = socket.id

                const newChat = createChat({ name: `${user.name} VS ${playerWait.name}`, users: [playerWait, user] })
                let room = {
                    id: newChat.id,
                    name: newChat.name,
                    squares: Array(400).fill(null),
                    turn: true,
                    isFinish: false,
                    isWinP1: false,
                    users: newChat.users,
                    confirm: false,
                    i: null,
                    j: null,
                }

                roomsPlay.push(room)
                socket.to(playerWait.socketId).emit("FIND_GAME", { newChat, room, Player1: true });
                socket.emit("FIND_GAME", { newChat, room, Player1: false });
                socket.to(playerWait.socketId).emit("SEND_PLAYER", { Player1: true });
                socket.emit("SEND_PLAYER", { Player1: false });
                // socket.to(playerWait.socketId).emit("PRIVATE_MESSAGE", newChat);
                // socket.emit("PRIVATE_MESSAGE", newChat);
                playerWait = {};
            }
        }
    })
    //CHECK_SQUARE_CLICK
    socket.on("CHECK_SQUARE_CLICK", ({ squares, isFinish_temp, isWinP1_temp, Player1, id, i }) => {
        let index = _.findIndex(roomsPlay, function (o) { return o.id == id; });
        console.log(index);
        console.log('isFinish_temp:', isFinish_temp)
        console.log('isWinP1_temp:', isWinP1_temp)
        console.log('Player1:', Player1)
        console.log('id:', id)
        roomsPlay[index].squares = squares;
        roomsPlay[index].isFinish = isFinish_temp;
        roomsPlay[index].isWinP1 = isWinP1_temp;
        roomsPlay[index].j = roomsPlay[index].i;
        roomsPlay[index].i = i;
        console.log('roomsPlay[index].i:', roomsPlay[index].i)


        // socket.emit("CHECK_SQUARE_CLICK", { test: true });
        if (Player1) {

            socket.to(roomsPlay[index].users[1].socketId).emit("CHECK_SQUARE_CLICK", roomsPlay[index]);

        }
        else {

            socket.to(roomsPlay[index].users[0].socketId).emit("CHECK_SQUARE_CLICK", roomsPlay[index]);

        }
        // console.log(roomsPlay[index]);
    })
    //REQUEST_UNDO
    socket.on("REQUEST_UNDO", ({ id, Player1 }) => {
        let index = _.findIndex(roomsPlay, function (o) { return o.id == id; });
        // socket.emit("CHECK_SQUARE_CLICK", { test: true });
        if (Player1) {
            socket.to(roomsPlay[index].users[1].socketId).emit("REQUEST_UNDO");

        }
        else {

            socket.to(roomsPlay[index].users[0].socketId).emit("REQUEST_UNDO");

        }
        // console.log(roomsPlay[index]);
    })
    //CONFIRM_UNDO
    socket.on("CONFIRM_UNDO", ({ id, Player1, confirm }) => {
        let index = _.findIndex(roomsPlay, function (o) { return o.id == id; });
        console.log("CONFIRM_UNDO WORK!!!!");
        console.log('confirm:', confirm);
        if (confirm) {
            console.log(roomsPlay[index].i);
            console.log(roomsPlay[index].squares[roomsPlay[index].i]);

            if (roomsPlay[index].i) {
                roomsPlay[index].squares[roomsPlay[index].i] = null;
                roomsPlay[index].i = null;
            }
            else {
                roomsPlay[index].squares[roomsPlay[index].j] = null;

            }

        }
        roomsPlay[index].confirm = confirm;
        // socket.emit("CHECK_SQUARE_CLICK", { test: true });
        if (Player1) {
            socket.to(roomsPlay[index].users[1].socketId).emit("CONFIRM_UNDO", (roomsPlay[index]));

        }
        else {

            socket.to(roomsPlay[index].users[0].socketId).emit("CONFIRM_UNDO", (roomsPlay[index]));

        }
        // console.log(roomsPlay[index]);
    })
    //Surrender
    socket.on("SURRENDER", ({ id, Player1 }) => {
        let index = _.findIndex(roomsPlay, function (o) { return o.id == id; });
        roomsPlay[index].isFinish = true;
        roomsPlay[index].isWinP1 = Player1 ? false : true;


        // socket.emit("CHECK_SQUARE_CLICK", { test: true });
        if (Player1) {
            socket.to(roomsPlay[index].users[1].socketId).emit("SURRENDER", roomsPlay[index]);

        }
        else {

            socket.to(roomsPlay[index].users[0].socketId).emit("SURRENDER", roomsPlay[index]);

        }
        // console.log(roomsPlay[index]);
    })


    //EXIT_ROOM
    socket.on("EXIT_ROOM", ({ id, Player1 }) => {
        let index = _.findIndex(roomsPlay, function (o) { return o.id == id; });
        roomsPlay[index].isFinish = true;
        roomsPlay[index].isWinP1 = Player1 ? true : false;


        // socket.emit("CHECK_SQUARE_CLICK", { test: true });
        if (Player1) {

            socket.to(roomsPlay[index].users[1].socketId).emit("EXIT_ROOM");

        }
        else {

            socket.to(roomsPlay[index].users[0].socketId).emit("EXIT_ROOM");

        }
        roomsPlay.splice(index, 1);
        console.log('roomsPlay after exiting:', roomsPlay)
        // console.log(roomsPlay[index]);
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
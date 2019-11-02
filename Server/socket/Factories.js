const uuidv4 = require('uuid/v4');




const createUser = ({ name = "" } = {}) => (
    {
        id: uuidv4(),
        name
    }
)
const createMessage = ({ message = "", sender = "" } = {}) => (
    {
        id: uuidv4(),
        time: new Date(Date.now()).getHours().toString() + ": " + new Date(Date.now()).getMinutes().toString(),
        message,
        sender
    }
)
const createChat = ({ messages = [], name = "Comunity", users = [] } = {}) => (
    {
        id: uuidv4(),
        messages,
        name,
        users,
        typingUser: []
    }
)
const getTime = (data) => {
    return `${date.getHours()}:${("0" + date.getMinutes()).slice(-2)}`
}
module.exports = {
    createUser,
    createChat,
    createMessage
}
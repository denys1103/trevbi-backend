const UserCollection = require("../models/user")

const getUser = async (userid = null) => {
    var user = await UserCollection.find({ email: { $ne: 'admin@gmail.com' }, status: 1}).select({ "fullname": 1, "avatar":1, "birth": 1, "bio": 1}) || [];
    user = user.map(item => item._doc);
    if (!userid) return user;

    user = user.find(item => item._id == userid);
    return user || {};
}

const checkHeader = (req, res, next) => {
    const client_id = req.get('client_id');
    const client_secret = req.get('client_secret');
    if (checkSecret(client_id, client_secret)) next();
    else res.status(401).send('Invalid credentional');
}
const checkSecret = (client_id, client_secret) => {
    console.log(client_id, client_secret);
    // return true;
    if (client_id == 'trevbi_client_id' && client_secret == 'trevbi_client_secret') return true;
    return false;
}

const emitOneUser = async (userid, key, data) => {
    const room = `room_${userid}`;
    const isOn = global.io.sockets.adapter.rooms.get(room);
  
    if (isOn && isOn.size > 0) {
      console.log(`Emitting to ${room}:`, key, data);
      global.io.to(room).emit(key, data);
    } else {
      console.log(`Room ${room} not found or empty`);
    }
  
    return true;
};

module.exports = {
    getUser, checkSecret, checkHeader, emitOneUser
}

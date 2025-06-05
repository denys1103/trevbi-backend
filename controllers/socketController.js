const User = require('../models/user');

const { checkSecret, emitOneUser } = require("../utils");

module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log(`New User connected: ${socket.id}`);

      if (!global.timer) global.timer = {}
      if (!global.curInterval) global.curInterval = {}

      socket.on("connected", ({ user, client_id, client_secret }) => {
        console.log(!checkSecret(client_id, client_secret));
        if (!checkSecret(client_id, client_secret)) {
          socket.emit("user-disconnected", { error: "credentional mismatch" });
          socket.leave(`room_${user.id}`);
          socket.disconnect();
          return;
        }
        const userid = user.id;
        socket.join(`room_${userid}`);
        socket.on("disconnect", () => {
          socket.leave(`room_${userid}`);
          socket.disconnect();
        });
      });
      
      socket.on('follow-request', async ({ senderid, receiverid }) => {
        emitOneUser(receiverid, 'follow-request', { senderid })
      });
    });
}
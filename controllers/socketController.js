const User = require('../models/user');

const { checkSecret, emitOneUser } = require("../utils");

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`New User connected: ${socket.id}`);
    socket.once("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected`);
    });

    if (!global.timer) global.timer = {}
    if (!global.curInterval) global.curInterval = {}

    socket.once("connected", ({ user, client_id, client_secret }) => {
      if (!checkSecret(client_id, client_secret)) {
        socket.emit("user-disconnected", { error: "credentional mismatch" });
        socket.disconnect();
        return;
      }

      const userid = user.id;
      const userRoom = `room_${userid}`;

      for (const room of socket.rooms || []) {
        if (room !== socket.id && room === userRoom) {
          socket.leave(room);
        }
      }

      socket.join(userRoom);
      console.log(`User ${userid} joined room_${userid}`);
    });
    
    socket.on('follow-request', async ({ senderid, receiverid }) => {
      try {
        await emitOneUser(receiverid, 'follow-request', { senderid });
      } catch (err) {
        console.error("emitOneUser failed:", err);
      }
    });
  });
}
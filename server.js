const express = require("express");
const http = require("http");
const enforce = require("express-sslify");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path");
const { AwakeHeroku } = require("awake-heroku");
const _ = require("lodash");

AwakeHeroku.add({
  url: "https://smishy.herokuapp.com",
});

app.use(enforce.HTTPS({ trustProtoHeader: true }));

app.use(express.static("./client/build"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
});

let users = [];
let queue = [];

io.on("connection", (socket) => {
  let isBusy = false;

  if (!_.includes(users, socket.id)) {
    users.push(socket.id);
  }
  socket.emit("yourID", socket.id);
  io.sockets.emit("allUsers", users);

  socket.on("disconnect", () => {
    _.pull(users, socket.id);

    const userInQueue = _.find(queue, u => u.id === socket.id);

    if (userInQueue) {
      _.remove(queue, {id: userInQueue.id});
      isBusy = false;

      console.log(queue);
    }
  });

  socket.on("leaveQueue", () => {
    const userInQueue = _.find(queue, u => u.id === socket.id);

    if (userInQueue && isBusy) {
      isBusy = false;
      _.remove(queue, {id: userInQueue.id});
      
      console.log(queue);
    }
  });

  socket.on("sendMessage", (data) => {
    socket.emit("messageSent", {
      message: data.message,
    });

    io.to(data.peerId).emit("receiveMessage", {
      message: data.message,
    });
  });

  socket.on("findPartner", (data) => {
    console.log(data);

    viablePartner = _.find(queue, u => {
      return u.id !== socket.id && u.onlyChat === data.onlyChat
    });

    console.log(viablePartner);

    if (!viablePartner && !isBusy) {
      isBusy = true;
      const userInQueue = _.find(queue, u => u.id === socket.id);
      if (!userInQueue) {
        queue.push({ id: socket.id, onlyChat: data.onlyChat });
        console.log(queue);
      }
    } else if (!isBusy) {
      isBusy = true;
      _.remove(queue, {id: viablePartner.id});

      console.log(queue);

      io.to(viablePartner.id).emit("peer", {
        peerId: socket.id,
        initiator: true,
      });

      socket.emit("peer", {
        peerId: viablePartner.id,
        initiator: false,
      });
    }
  });

  socket.on("signal", (data) => {
    if (!data.peerId) {
      return;
    }

    isBusy = false;
    io.to(data.peerId).emit("signal", {
      signal: data.signal,
      peerId: socket.id,
    });
  });

  // socket.on("close", (data) => {
  //   io.to(data.peerId).emit("close");
  // });
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

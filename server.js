const express = require("express");
const http = require("http");
const enforce = require("express-sslify");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const username = require("username-generator");
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
  console.log("your socket is" + socket.id);

  let viablePartners = [];
  let isBusy = false;

  if (!_.includes(users, socket.id)) {
    users.push(socket.id);
  }
  socket.emit("yourID", socket.id);
  io.sockets.emit("allUsers", users);

  socket.on("disconnect", () => {
    _.pull(users, socket.id);
    if (_.includes(queue, socket.id)) {
      _.pull(queue, socket.id);
    }
  });

  socket.on("leaveQueue", () => {
    if (_.includes(queue, socket.id)) {
      _.pull(queue, socket.id);
    }
  });

  socket.on("findPartner", (data) => {
    viablePartners = _.filter(queue, (id) => {
      return id !== socket.id;
    });
    if (!viablePartners.length) {
      if (!_.includes(queue, socket.id)) {
        queue.push(socket.id);
        isBusy = true;
      }
    } else {
      isBusy = true;
      let currentPartner = viablePartners[0];
      let partnerSocket = io.sockets.connected[currentPartner];

      _.pull(queue, currentPartner);

      partnerSocket.emit("peer", {
        peerId: socket.id,
        initiator: true,
      });

      socket.emit("peer", {
        peerId: partnerSocket.id,
        initiator: false,
      });
    }
  });

  socket.on("signal", (data) => {
    var socket2 = io.sockets.connected[data.peerId];
    if (!socket2) {
      return;
    }

    socket2.emit("signal", {
      signal: data.signal,
      peerId: socket.id,
    });
  });

  socket.on("close", (data) => {
    io.to(data.peerId).emit("close");
  });
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

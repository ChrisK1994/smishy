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

const users = [];
const queue = [];

io.on("connection", (socket) => {
  if (!_.includes(user, socket.id)) {
    users.push(socket.id);
  }
  socket.emit("yourID", socket.id);
  io.sockets.emit("allUsers", users);

  socket.on("disconnect", () => {
    _.remove(users, (user) => { user === socket.id })
  });

  socket.on("leaveQueue", () => {
    _.remove(queue, (user) => { user === socket.id })
  });

  socket.on("findPartner", (data) => {
    if (!queue.length) {
      queue.push(socket.id);
    } else {
      socket.emit("chatInit");
    }
  });

  socket.on("chatInit", (data) => {

    io.to(queue[0]).emit("chatOffer", {
      signal: data.signalData,
      from: data.from,
    });

    queue = [];
  });

  socket.on("chatAccepted", (data) => {
    io.to(data.to).emit("chatAccepted", {
      signal: data.signal,
      from: socket.id,
    });
  });

  socket.on("close", (data) => {
    io.to(data.to).emit("close");
  });

  socket.on("rejected", (data) => {
    io.to(data.to).emit("rejected");
  });
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

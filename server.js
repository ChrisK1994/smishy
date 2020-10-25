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

  let currentPartner = "";
  let viablePartners = [];
  let isBusy = false;

  if (!_.includes(users, socket.id)) {
    users.push(socket.id);
  }
  socket.emit("yourID", socket.id);
  io.sockets.emit("allUsers", users);

  socket.on("disconnect", () => {
    console.log("disconnect " + isBusy);
    _.pull(users, socket.id);
    if (_.includes(queue, socket.id)) {
      _.pull(queue, socket.id);
    }
    currentPartner = "";
    isBusy = false;
  });

  socket.on("leaveQueue", () => {
    console.log("leaveQueue " + isBusy);
    if (_.includes(queue, socket.id)) {
      _.pull(queue, socket.id);
    }
    isBusy = false;
  });

  socket.on("findPartner", (data) => {
    console.log("findPartner " + isBusy);
    if (!isBusy) {
      viablePartners = _.filter(queue, (id) => {
        return id !== currentPartner && id !== socket.id;
      });
      if (!viablePartners.length) {
        if (!_.includes(queue, socket.id)) {
          queue.push(socket.id);
          isBusy = true;
        }
      } else {
        isBusy = true;
        currentPartner = viablePartners[0];
        _.pull(queue, currentPartner);
        socket.emit("foundPartner");
      }
    }
  });

  socket.on("initiatorReady", (data) => {
    console.log(data.from);
    console.log("initiatorReady " + isBusy);
    io.to(currentPartner).emit("initiatorOffer", {
      signal: data.signalData,
      from: data.from,
    });
  });

  socket.on("initiatorAccepted", (data) => {
    isBusy = true;
    currentPartner = data.to;
    console.log("initiatorAccepted " + isBusy);
    io.to(data.to).emit("chatReady", {
      signal: data.signal,
      from: socket.id,
    });
  });

  socket.on("close", (data) => {
    currentPartner = "";
    io.to(data.to).emit("close");
  });
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

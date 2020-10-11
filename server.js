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

const users = {};
const waitingUsers = {};

io.on("connection", (socket) => {
  const userid = username.generateUsername("-");
  if (!users[userid]) {
    users[userid] = socket.id;
  }
  socket.emit("yourID", userid);
  io.sockets.emit("allUsers", users);

  socket.on("disconnect", () => {
    delete users[userid];
  });

  socket.on("leaveQueue", () => {
    delete waitingUsers[userid];
  });

  socket.on("findPartner", (data) => {
    if (_.isEmpty(waitingUsers)) {
      waitingUsers[data.from] = socket.id;
    } else {
      socket.emit("chatInit");
    }
  });

  socket.on("chatInit", (data) => {
    let waitingUserId = Object.keys(waitingUsers)[0];
    delete waitingUsers[waitingUserId];

    io.to(users[waitingUserId]).emit("chatOffer", {
      signal: data.signalData,
      from: data.from,
    });
  });

  socket.on("chatAccepted", (data) => {
    io.to(users[data.to]).emit("chatAccepted", {
      signal: data.signal,
      from: userid,
    });
  });

  socket.on("close", (data) => {
    io.to(users[data.to]).emit("close");
  });

  socket.on("rejected", (data) => {
    io.to(users[data.to]).emit("rejected");
  });
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

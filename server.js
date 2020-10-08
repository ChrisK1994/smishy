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
const Client = require('./client');
const _ = require('lodash');

AwakeHeroku.add({
  url: "https://smishy.herokuapp.com",
});

app.use(enforce.HTTPS({ trustProtoHeader: true }));

app.use(express.static("./client/build"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
});

const clientList = [];
const waitingList = [];

io.on("connection", (socket) => {
  let client = new Client(socket);
  socket.on("disconnect", () => onDisconnect(client));
  socket.on("next", () => onRequestNext(client));
  socket.on("msg", (msg) => onMessage(client, msg));
  socket.on("info", (info) => onReceiveInfo(client, info));
  socket.on("videochat_init", (res) => onVideoInit(client, res));
  socket.on("videochat_offer_ok", (res) => onVideoOfferOK(client, res));
  socket.on("videochat_ice", (candidate) => onVideoICE(client, candidate));
  clientList.push(client);
});

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

function onDisconnect(client) {
  try {
    client.disconnectFromPartner();
    _.remove(clientList, (c) => c.id === client.id);
    _.remove(waitingList, (c) => c.id === client.id);
  } catch (e) {
    console.log('[ERROR] ', e.message);
  }
}

function onReceiveInfo(client, info) {
  try {
    client.setChatType(info.isVideoChat ? 1 : 0);
  } catch (e) {
    console.log("[ERROR] ", e.message);
  }
}

function onVideoICE(client, candidate) {
  try {
    let partner = client.getPartner();
    partner.sendVideoICE(candidate);
  } catch (e) {
    console.log("[ERROR] ", e.message);
  }
}

function onMessage(client, msg) {
  client.sendMessageToPartner(msg);
}

function onVideoInit(client, res) {
  try {
    if (res) {
      let partner = client.getPartner();
      partner.sendVideoOffer(res);
    }
  } catch (e) {
    console.log("[ERROR] ", e.message);
  }
}

function onVideoOfferOK(client, res) {
  try {
    if (res) {
      let partner = client.getPartner();
      partner.sendVideoOfferResponse(res);
    }
  } catch (e) {
    console.log("[ERROR] ", e.message);
  }
}

function onRequestNext(client) {
  try {
    let partner = false;

    client.disconnectFromPartner();
    client.sendSystemInfo("waiting_partner");

    for (let possiblePartner of waitingList) {
      if (client.isValidPartner(possiblePartner)) {
        partner = possiblePartner;
        break;
      }
    }

    if (!partner) {
      if (!_.some(waitingList, ["id", client.id])) {
        client.waitNext();
        waitingList.push(client);
      }
    } else {
      _.remove(waitingList, (c) => c.id === client.id || c.id === partner.id);
      client.setPartnerInfo(partner);
      client.requestVideoInit();
      partner.setPartnerInfo(client);
    }
  } catch (e) {
    console.log("[ERROR] ", e.message);
  }
}

const express = require('express');
const http = require('http');
const enforce = require('express-sslify');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);
const username = require('username-generator');
const path = require('path');
const { AwakeHeroku } = require('awake-heroku');

AwakeHeroku.add({
    url: "https://smishy.herokuapp.com"
})

app.use(enforce.HTTPS({ trustProtoHeader: true }));

app.use(express.static('./client/build'));

app.get('*', (req,res)=>{
    res.sendFile(path.resolve(__dirname, "client","build","index.html"));
})

const users={}
const waitingUsers={}

io.on('connection', socket => {
    const userid=username.generateUsername('-')
    if(!users[userid]){
        users[userid] = socket.id
    }
    console.log(users);
    if(waitingUsers === {}) {
        console.log(waitingUsers);
    }
    socket.emit('yourID', userid)
    io.sockets.emit('allUsers', users)
    
    socket.on('disconnect', ()=>{
        delete users[userid]
    })

    socket.on('leaveQueue', ()=>{
        delete waitingUsers[userid];
    })

    socket.on('findPatner', (data)=>{
        if(waitingUsers === {}) {
            waitingUsers[data.from] = data.signalData;
            console.log("waiting users filling" + waitingUsers)
        } else {
            let waitingUserId = Object.keys(waitingUsers)[0];
            let waitingUserSocket = Object.values(waitingUsers)[0];
            delete waitingUsers[waitingUserId];

            io.to(users[waitingUserId]).emit('foundPartner', data.signal)
            io.to(users[data.from]).emit('foundPartner', waitingUserSocket)
        }
        console.log(waitingUsers);
        console.log(Object.keys(waitingUsers)[0]);
        console.log(Object.values(waitingUsers)[0]);
        console.log(data.from);
        console.log(data.signalData);
        // io.to(users[data.to]).emit('foundPartner', data.signal)
        // waitingUsers[userid] = socket.id;
        // io.to(users[data.userToCall]).emit('hey', {signal: data.signalData, from: data.from})
    })

    socket.on('acceptCall', (data)=>{
        io.to(users[data.to]).emit('callAccepted', data.signal)
    })

    socket.on('close', (data)=>{
        io.to(users[data.to]).emit('close')
    })

    socket.on('rejected', (data)=>{
        io.to(users[data.to]).emit('rejected')
    })
})

const port = process.env.PORT || 8000

server.listen(port, ()=>{
    console.log(`Server running on port ${port}`)
})
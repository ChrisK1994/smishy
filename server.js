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

app.use(enforce.HTTPS());

app.use(express.static('./client/build'));

app.get('*', (req,res)=>{
    res.sendFile(path.resolve(__dirname, "client","build","index.html"));
})

const users={}

io.on('connection', socket => {
    const userid=username.generateUsername('-')
    if(!users[userid]){
        users[userid] = socket.id
    }
    socket.emit('yourID', userid)
    io.sockets.emit('allUsers', users)
    
    socket.on('disconnect', ()=>{
        delete users[userid]
    })

    socket.on('callUser', (data)=>{
        io.to(users[data.userToCall]).emit('hey', {signal: data.signalData, from: data.from})
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
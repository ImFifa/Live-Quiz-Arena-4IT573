const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const db = require('./db');
const socketHandler = require('./socketHandler');
const apiRoutes = require('./routes/api');

app.use('/api', apiRoutes);

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/host', (req, res) => {
  res.render('host');
});

app.get('/join', (req, res) => {
  res.render('join');
});

socketHandler(io);

server.listen(3000, () => {
  console.log('Live Quiz Arena běží na http://localhost:3000');
});

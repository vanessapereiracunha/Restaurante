require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' &&
      req.headers['x-forwarded-proto'] &&
      req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

const PUBLIC = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC));

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes(io));

app.get('/',        (req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));
app.get('/staff',   (req, res) => res.sendFile(path.join(PUBLIC, 'staff.html')));
app.get('/mesa/:code', (req, res) => res.sendFile(path.join(PUBLIC, 'mesa.html')));

io.on('connection', (socket) => {
  socket.on('join:table', (code) => socket.join(`table-${code}`));
  socket.on('join:staff', (token) => {
    if (token === process.env.STAFF_ACCESS_TOKEN) socket.join('staff');
  });
});

server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

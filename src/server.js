require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // simplificado para o escopo do projeto; em producao restringir ao dominio
});

const PORT = process.env.PORT || 3000;

// RNF1: cabecalhos de seguranca
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdn.tailwindcss.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        connectSrc: ["'self'", "wss:", "ws:"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());

// Redireciona HTTP -> HTTPS em producao (a maioria dos PaaS ja faz isso, isto e uma camada extra)
app.use((req, res, next) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'public')));

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes(io));

// Rotas amigaveis (RF2)
app.get('/mesa/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'mesa.html'));
});

app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'staff.html'));
});

// T4.2: rooms por mesa e room de staff
io.on('connection', (socket) => {
  socket.on('join:table', (code) => {
    socket.join(`table-${code}`);
  });

  socket.on('join:staff', (token) => {
    if (token === process.env.STAFF_ACCESS_TOKEN) {
      socket.join('staff');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

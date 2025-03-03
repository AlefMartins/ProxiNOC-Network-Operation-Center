require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Utilitários e configurações
const logger = require('./utils/logger');
const db = require('./models');
const errorMiddleware = require('./middlewares/error.middleware');
const loggingMiddleware = require('./middlewares/logging.middleware');

// Inicialização do servidor
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configurações básicas do Express
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pasta de uploads
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Middleware de logs
app.use(loggingMiddleware);

// Rotas da API
app.use('/api', require('./routes'));

// Tratamento de erros
app.use(errorMiddleware);

// Socket.IO para o terminal web e notificações
io.on('connection', (socket) => {
  logger.info(`Conexão WebSocket estabelecida: ${socket.id}`);

  // Autenticação do socket via token JWT
  socket.on('authenticate', (token) => {
    // A implementação da autenticação será feita no terminal.service.js
  });

  // Eventos para o terminal web
  socket.on('terminal:connect', (data) => {
    // A implementação da conexão ao terminal será feita no terminal.service.js
  });

  socket.on('terminal:data', (data) => {
    // A implementação do envio de dados ao terminal será feita no terminal.service.js
  });

  socket.on('disconnect', () => {
    logger.info(`Conexão WebSocket encerrada: ${socket.id}`);
    // Limpeza de recursos quando o socket é desconectado
  });
});

// Exporta io para ser usado em outros arquivos
app.set('io', io);

// Inicialização do banco de dados e servidor
const PORT = process.env.PORT || 3001;

db.sequelize.authenticate()
  .then(() => {
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');

    httpServer.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT} em ambiente ${process.env.NODE_ENV}.`);
    });
  })
  .catch(err => {
    logger.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  });

// Tratamento de exceções não capturadas
process.on('uncaughtException', (err) => {
  logger.error('Exceção não capturada:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejeição não tratada:', reason);
});

module.exports = app;
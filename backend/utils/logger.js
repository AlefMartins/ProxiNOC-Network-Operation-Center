const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Certifique-se de que o diretório de logs existe
const logDirectory = path.resolve(process.env.LOG_FILE_PATH || 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logFilePath = path.join(logDirectory, 'app.log');

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'tacacs-ldap-manager' },
  transports: [
    // Sempre logar para o console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
        )
      )
    })
  ]
});

// Adicionar transporte para arquivo se configurado
if (process.env.LOG_TO_FILE === 'true') {
  logger.add(new winston.transports.File({
    filename: logFilePath,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: winston.format.combine(
      winston.format.printf(
        info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
      )
    )
  }));
}

module.exports = logger;
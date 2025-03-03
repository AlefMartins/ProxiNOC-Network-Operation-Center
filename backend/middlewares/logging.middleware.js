const logger = require('../utils/logger');

/**
 * Middleware para logar todas as requisições
 */
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Log da requisição recebida
  logger.info(`${method} ${originalUrl} - Request received from ${ip}`);

  // Capturar quando a resposta for enviada
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Determinar o nível de log com base no status code
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    // Log da resposta
    logger[logLevel](
      `${method} ${originalUrl} - ${statusCode} - ${duration}ms`
    );
  });

  next();
};

module.exports = loggingMiddleware;
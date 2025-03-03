const logger = require('../utils/logger');

/**
 * Middleware para tratamento de erros
 */
const errorMiddleware = (err, req, res, next) => {
  // Log do erro
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Determinar o status HTTP do erro
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Erro interno do servidor';

  // Erros específicos do Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    errorMessage = err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    errorMessage = 'Não é possível excluir este registro pois ele está sendo referenciado por outros registros.';
  } else if (err.name === 'SequelizeDatabaseError') {
    statusCode = 400;
    errorMessage = 'Erro no banco de dados. Verifique seus dados e tente novamente.';
  }

  // Erros de autenticação
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorMessage = 'Não autorizado. Faça login novamente.';
  }

  // Erros de validação do Joi
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // Erro de acesso negado
  if (err.name === 'ForbiddenError') {
    statusCode = 403;
  }

  // Erro de recurso não encontrado
  if (err.name === 'NotFoundError') {
    statusCode = 404;
  }

  // Em ambiente de produção, não enviar detalhes de erros 500
  const isProd = process.env.NODE_ENV === 'production';
  const response = {
    error: true,
    message: statusCode === 500 && isProd ? 'Erro interno do servidor' : errorMessage,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
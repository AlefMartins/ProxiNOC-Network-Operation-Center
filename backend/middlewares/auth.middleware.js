const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Verifica se o usuário está autenticado via token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Não autorizado. Token JWT é obrigatório.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se o usuário existe e está ativo
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Usuário não encontrado.'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: true,
        message: 'Usuário está desativado.'
      });
    }

    // Adicionar o usuário ao objeto de requisição
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expirado. Faça login novamente.'
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Token inválido. Faça login novamente.'
      });
    }

    logger.error('Erro na autenticação:', err);
    return res.status(500).json({
      error: true,
      message: 'Erro ao processar autenticação.'
    });
  }
};

module.exports = {
  authenticate
};
const logger = require('../utils/logger');

/**
 * Verifica se o usuário tem as permissões necessárias
 * @param {string|string[]} requiredPermissions - Permissão ou array de permissões necessárias
 * @returns {function} - Middleware Express
 */
const checkPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: true,
          message: 'Usuário não autenticado'
        });
      }

      // Obter todas as permissões do usuário
      const userPermissions = await user.getPermissions();
      
      // Converter para array se uma única permissão for passada
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Verificar se o usuário tem todas as permissões necessárias
      const hasAllPermissions = permissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          error: true,
          message: 'Acesso negado. Você não tem permissão para acessar este recurso.'
        });
      }

      next();
    } catch (err) {
      logger.error('Erro ao verificar permissões:', err);
      return res.status(500).json({
        error: true,
        message: 'Erro ao verificar permissões.'
      });
    }
  };
};

module.exports = {
  checkPermission
};
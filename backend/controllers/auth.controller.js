const authService = require('../services/auth.service');
const logger = require('../utils/logger');

/**
 * Controlador de autenticação
 */
class AuthController {
  /**
   * Realiza o login do usuário
   * @param {object} req - Requisição Express
   * @param {object} res - Resposta Express
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validar campos obrigatórios
      if (!username || !password) {
        return res.status(400).json({
          error: true,
          message: 'Usuário e senha são obrigatórios'
        });
      }

      // Obter o IP do cliente
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Realizar o login
      const result = await authService.login(username, password, ipAddress);
      
      res.json(result);
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(401).json({
        error: true,
        message: error.message || 'Credenciais inválidas'
      });
    }
  }

  /**
   * Realiza o logout do usuário
   * @param {object} req - Requisição Express
   * @param {object} res - Resposta Express
   */
  async logout(req, res) {
    try {
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Registrar logout
      await authService.logout(userId, ipAddress);
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao processar logout'
      });
    }
  }

  /**
   * Verifica se o token é válido e retorna dados do usuário
   * @param {object} req - Requisição Express
   * @param {object} res - Resposta Express
   */
  async verifyToken(req, res) {
    try {
      // O middleware de autenticação já verificou o token
      const user = req.user;
      
      // Obter permissões do usuário
      const permissions = await user.getPermissions();
      
      res.json({
        user,
        permissions,
        authenticated: true
      });
    } catch (error) {
      logger.error('Erro na verificação de token:', error);
      res.status(401).json({
        error: true,
        message: 'Token inválido ou expirado',
        authenticated: false
      });
    }
  }
}

module.exports = new AuthController();
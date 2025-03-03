const jwt = require('jsonwebtoken');
const { User, AccessLog } = require('../models');
const logger = require('../utils/logger');
const ldapService = require('./ldap.service');
const { Op } = require('sequelize');

/**
 * Serviço de autenticação
 */
class AuthService {
  /**
   * Realiza o login do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @param {string} ipAddress - Endereço IP
   * @returns {object} - Dados do usuário e token JWT
   */
  async login(username, password, ipAddress) {
    try {
      logger.info(`Tentativa de login para usuário: ${username}`);
      
      // Buscar o usuário pelo nome de usuário
      const user = await User.findOne({
        where: { username }
      });

      // Se o usuário não existe, registre a tentativa e retorne erro
      if (!user) {
        logger.warn(`Usuário não encontrado: ${username}`);
        await this._logFailedLogin(username, null, ipAddress, 'Usuário não encontrado');
        throw new Error('Credenciais inválidas');
      }

      // Verificar se o usuário está ativo
      if (!user.is_active) {
        logger.warn(`Tentativa de login com usuário desativado: ${username}`);
        await this._logFailedLogin(username, user.id, ipAddress, 'Usuário desativado');
        throw new Error('Usuário desativado. Entre em contato com o administrador');
      }

      let isValidLogin = false;

      // Verificar o tipo de autenticação
      if (user.auth_type === 'local') {
        // Autenticação local
        logger.info(`Realizando autenticação local para: ${username}`);
        isValidLogin = await user.validatePassword(password);
        logger.info(`Resultado da validação de senha: ${isValidLogin}`);
      } else if (user.auth_type === 'ldap') {
        // Autenticação LDAP
        const ldapEnabled = await ldapService.isEnabled();
        if (ldapEnabled) {
          logger.info(`Realizando autenticação LDAP para: ${username}`);
          try {
            isValidLogin = await ldapService.authenticate(user.ldap_dn, password);
          } catch (ldapError) {
            logger.error(`Erro na autenticação LDAP para o usuário ${username}:`, ldapError);
            isValidLogin = false;
          }
        } else {
          logger.warn(`Tentativa de autenticação LDAP, mas LDAP está desabilitado`);
          isValidLogin = false;
        }
      }

      // Se a autenticação falhou, incrementar falhas e registrar
      if (!isValidLogin) {
        logger.warn(`Senha incorreta para usuário: ${username}`);
        user.failed_login_attempts += 1;
        await user.save();
        await this._logFailedLogin(username, user.id, ipAddress, 'Senha incorreta');
        throw new Error('Credenciais inválidas');
      }

      // Resetar contador de falhas se login bem-sucedido
      logger.info(`Login bem-sucedido para: ${username}`);
      user.failed_login_attempts = 0;
      user.last_login = new Date();
      await user.save();

      // Registrar login bem-sucedido
      await AccessLog.create({
        user_id: user.id,
        device_id: null,
        action: 'login',
        ip_address: ipAddress,
        details: 'Login bem-sucedido'
      });

      // Gerar token JWT
      const token = this.generateToken(user);

      // Retornar dados do usuário (exceto senha)
      const userData = user.toJSON();
      delete userData.password;

      // Obter permissões do usuário
      const permissions = await user.getPermissions();

      return {
        user: userData,
        permissions,
        token
      };
    } catch (error) {
      logger.error(`Erro na tentativa de login para o usuário ${username}:`, error);
      throw error;
    }
  }

  /**
   * Registra logout do usuário
   * @param {number} userId - ID do usuário
   * @param {string} ipAddress - Endereço IP
   */
  async logout(userId, ipAddress) {
    try {
      await AccessLog.create({
        user_id: userId,
        device_id: null,
        action: 'logout',
        ip_address: ipAddress,
        details: 'Logout bem-sucedido'
      });

      return { success: true };
    } catch (error) {
      logger.error(`Erro ao registrar logout para o usuário ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gera um token JWT para o usuário
   * @param {object} user - Objeto de usuário
   * @returns {string} - Token JWT
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '24h'
    });
  }

  /**
   * Registra falha de login
   * @param {string} username - Nome de usuário
   * @param {number|null} userId - ID do usuário (se encontrado)
   * @param {string} ipAddress - Endereço IP
   * @param {string} reason - Motivo da falha
   */
  async _logFailedLogin(username, userId, ipAddress, reason) {
    try {
      await AccessLog.create({
        user_id: userId || null,
        device_id: null,
        action: 'login_failed',
        ip_address: ipAddress,
        details: `Falha no login para ${username}: ${reason}`
      });
    } catch (error) {
      logger.error('Erro ao registrar falha de login:', error);
    }
  }

  /**
   * Verifica se um token é válido
   * @param {string} token - Token JWT
   * @returns {object} - Payload do token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.error('Erro ao verificar token JWT:', error);
      throw error;
    }
  }

  /**
   * Busca um usuário pelo ID
   * @param {number} userId - ID do usuário
   * @returns {object} - Dados do usuário
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return user;
    } catch (error) {
      logger.error(`Erro ao buscar usuário ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new AuthService();
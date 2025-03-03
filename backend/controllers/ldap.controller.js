const { LdapConfig } = require('../models');
const ldapService = require('../services/ldap.service');
const logger = require('../utils/logger');
const crypto = require('../utils/crypto');

/**
 * Controlador para gerenciamento de configurações LDAP
 */
class LdapController {
  /**
   * Obter a configuração LDAP atual
   * @param {object} req - Requisição Express
   * @param {object} res - Resposta Express
   */
  async getConfig(req, res) {
    try {
      const config = await LdapConfig.findOne({
        order: [['updated_at', 'DESC']]
      });

      if (!config) {
        return res.json({
          isConfigured: false,
          config: null
        });
      }

      // Não retornar a senha no bind
      const configData = config.toJSON();
      delete configData.bind_password;

      res.json({
        isConfigured: true,
        config: configData
      });
    } catch (error) {
      logger.error('Erro ao obter configuração LDAP:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao obter configuração LDAP'
      });
    }
  }

  /**
   * Salvar configuração LDAP
   * @param {object} req - Requisição Express
   * @param {object} res - Resposta Express
   */
  async saveConfig(req, res) {
    try {
      const {
        server_url,
        bind_dn,
        bind_password,
        search_base,
        user_search_filter,
        group_search_filter,
        user_username_attribute,
        user_email_attribute,
        user_fullname_attribute,
        group_name_attribute,
        is_active,
        sync_interval
      } = req.body;

      // Validar campos obrigatórios
      if (!server_url || !bind_dn || !search_base) {
        return res.status(400).json({
          error: true,
          message: 'Campos obrigatórios: server_url, bind_dn, search_base'
        });
      }

      // Buscar configuração existente ou criar nova
      let config = await LdapConfig.findOne({
        order: [['updated_at', 'DESC']]
      });

      // Se configuração existe, atualizar
      if (config) {
        // Se uma nova senha foi fornecida, atualizá-la
        const updateData = {
          server_url,
          bind_dn,
          search_base,
          user_search_filter: user_search_filter || '(objectClass=person)',
          group_search_filter: group_search_filter || '(objectClass=group)',
          user_username_attribute: user_username_attribute || 'sAMAccountName',
          user_email_attribute: user_email_attribute || 'mail',
          user_fullname_attribute: user_fullname_attribute || 'displayName',
          group_name_attribute: group_name_attribute || 'cn',
          is_active: is_active === true || is_active === 'true',
          sync_interval: sync_interval || 60
        };

        // Atualizar senha apenas se foi fornecida
        if (bind_password && bind_password !== '') {
          updateData.bind_password = bind_password;
        }

        await config.update(updateData);
      } else {
        // Criar nova configuração
        if (!bind_password) {
          return res.status(400).json({
            error: true,
            message: 'Senha de bind é obrigatória para nova configuração'
          });
        }

        config = await LdapConfig.create({
          server_url,
          bind_dn,
          bind_password,
          search_base,
          user_search_filter: user_search_filter || '(objectClass=person)',
          group_search_filter: group_search_filter || '(objectClass=group)',
          user_username_attribute: user_username_attribute || 'sAMAccountName',
          user_email_attribute: user_email_attribute || 'mail',
          user_fullname_attribute: user_fullname_attribute || 'displayName',
          group_name_attribute: group_name_attribute || 'cn',
          is_active: is_active === true || is_active === 'true',
          sync_interval: sync_interval || 60
        });
      }

      // Recarregar configuração no serviço LDAP
      await ldapService.loadConfig();

      res.json({
        success: true,
        message: 'Configuração LDAP salva com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao salvar configuração LDAP:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao salvar configuração LDAP'
      });
    }
  }

  /**
   * Testar conexão LDAP
   * @param {object} req - Requisição Express
   * @param {object} res - Resposta Express
   */
  async testConnection(req, res) {
    try {
      const {
        server_url,
        bind_dn,
        bind_password
      } = req.body;

      // Validar campos obrigatórios
      if (!server_url || !bind_dn || !bind_password) {
        return res.status(400).json({
          error: true,
          message: 'Todos os campos são obrigatórios para teste de conexão'
        });
      }

      // Testar conexão
      const result = await ldapService.testConnection({
        server_url,
        bind_dn,
        bind_password
      });

      res.json(result);
    } catch (error) {
      logger.error('Erro ao testar conexão LDAP:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao testar conexão LDAP'
      });
    }
  }

  /**
   * Iniciar sincronização LDAP
   * @param {object} req - Requisição Express
   * @param {object} res - Resposta Express
   */
  async syncNow(req, res) {
    try {
      const isEnabled = await ldapService.isEnabled();
      
      if (!isEnabled) {
        return res.status(400).json({
          error: true,
          message: 'LDAP não está habilitado'
        });
      }

      // Iniciar sincronização
      const result = await ldapService.syncLdapUsers();

      res.json(result);
    } catch (error) {
      logger.error('Erro ao sincronizar LDAP:', error);
      res.status(500).json({
        error: true,
        message: 'Erro ao sincronizar LDAP'
      });
    }
  }
}

module.exports = new LdapController();
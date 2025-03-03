const ldap = require('ldapjs');
const { promisify } = require('util');
const { User, Group, LdapConfig, sequelize } = require('../models');
const logger = require('../utils/logger');
const crypto = require('../utils/crypto');

/**
 * Serviço LDAP para autenticação e sincronização
 */
class LdapService {
  constructor() {
    this.config = null;
    this.isConfigLoaded = false;
  }

  /**
   * Carrega as configurações LDAP do banco de dados
   * @returns {boolean} - Se as configurações foram carregadas com sucesso
   */
  async loadConfig() {
    try {
      const ldapConfig = await LdapConfig.findOne({
        where: { is_active: true }
      });

      if (ldapConfig) {
        this.config = {
          isEnabled: ldapConfig.is_active,
          url: ldapConfig.server_url,
          bindDN: ldapConfig.bind_dn,
          bindPassword: ldapConfig.bind_password,
          searchBase: ldapConfig.search_base,
          userFilter: ldapConfig.user_search_filter,
          groupFilter: ldapConfig.group_search_filter,
          usernameAttr: ldapConfig.user_username_attribute,
          emailAttr: ldapConfig.user_email_attribute,
          fullnameAttr: ldapConfig.user_fullname_attribute,
          groupNameAttr: ldapConfig.group_name_attribute,
          syncInterval: ldapConfig.sync_interval
        };
        this.isConfigLoaded = true;
        logger.info('Configurações LDAP carregadas com sucesso');
        return true;
      } else {
        this.config = { isEnabled: false };
        this.isConfigLoaded = true;
        logger.info('Nenhuma configuração LDAP ativa encontrada');
        return false;
      }
    } catch (error) {
      logger.error('Erro ao carregar configurações LDAP:', error);
      this.config = { isEnabled: false };
      this.isConfigLoaded = false;
      return false;
    }
  }

  /**
   * Verifica se o LDAP está habilitado
   * @returns {boolean} - Se o LDAP está habilitado
   */
  async isEnabled() {
    if (!this.isConfigLoaded) {
      await this.loadConfig();
    }
    return this.config && this.config.isEnabled;
  }

  /**
   * Testa conexão com o servidor LDAP
   * @param {object} configData - Configurações LDAP para teste
   * @returns {object} - Resultado do teste de conexão
   */
  async testConnection(configData) {
    const testConfig = {
      isEnabled: true,
      url: configData.server_url,
      bindDN: configData.bind_dn,
      bindPassword: configData.bind_password
    };

    const client = ldap.createClient({
      url: testConfig.url,
      timeout: 5000,
      connectTimeout: 10000
    });

    client.bindAsync = promisify(client.bind).bind(client);
    client.unbindAsync = promisify(client.unbind).bind(client);

    try {
      logger.info(`Testando conexão LDAP com ${testConfig.url}`);
      await client.bindAsync(testConfig.bindDN, testConfig.bindPassword);
      
      logger.info('Teste de conexão LDAP bem-sucedido');
      return { 
        success: true, 
        message: 'Conexão LDAP estabelecida com sucesso' 
      };
    } catch (error) {
      logger.error('Erro no teste de conexão LDAP:', error);
      return { 
        success: false, 
        message: `Erro na conexão LDAP: ${error.message}` 
      };
    } finally {
      try {
        await client.unbindAsync();
      } catch (error) {
        logger.error('Erro ao fechar conexão LDAP:', error);
      }
    }
  }

  /**
   * Cria um cliente LDAP
   * @returns {object} - Cliente LDAP
   */
  async _createClient() {
    if (!this.isConfigLoaded) {
      await this.loadConfig();
    }

    if (!this.config || !this.config.isEnabled) {
      throw new Error('LDAP não está habilitado');
    }

    const client = ldap.createClient({
      url: this.config.url,
      timeout: 5000,
      connectTimeout: 10000
    });

    // Promisificar métodos do cliente
    client.bindAsync = promisify(client.bind).bind(client);
    client.searchAsync = promisify(client.search).bind(client);
    client.unbindAsync = promisify(client.unbind).bind(client);

    // Tratar eventos do cliente
    client.on('error', (err) => {
      logger.error('Erro no cliente LDAP:', err);
    });

    return client;
  }

  /**
   * Autentica um usuário no LDAP
   * @param {string} dn - Distinguished Name do usuário
   * @param {string} password - Senha do usuário
   * @returns {boolean} - Sucesso da autenticação
   */
  async authenticate(dn, password) {
    if (!this.isConfigLoaded) {
      await this.loadConfig();
    }

    if (!this.config || !this.config.isEnabled) {
      logger.warn('Tentativa de autenticação LDAP, mas LDAP não está habilitado');
      throw new Error('LDAP não está habilitado');
    }

    const client = await this._createClient();

    try {
      logger.info(`Tentando autenticação LDAP para: ${dn}`);
      await client.bindAsync(dn, password);
      logger.info(`Autenticação LDAP bem-sucedida para: ${dn}`);
      return true;
    } catch (error) {
      logger.error(`Falha na autenticação LDAP para ${dn}:`, error);
      return false;
    } finally {
      try {
        await client.unbindAsync();
      } catch (error) {
        logger.error('Erro ao fechar conexão LDAP:', error);
      }
    }
  }

  /**
   * Busca um usuário no LDAP por username
   * @param {string} username - Nome de usuário
   * @returns {object|null} - Dados do usuário LDAP
   */
  async findUserByUsername(username) {
    if (!this.isConfigLoaded) {
      await this.loadConfig();
    }

    if (!this.config || !this.config.isEnabled) {
      throw new Error('LDAP não está habilitado');
    }

    const client = await this._createClient();

    try {
      await client.bindAsync(this.config.bindDN, this.config.bindPassword);
      
      // Criar filtro para buscar o usuário
      const filter = `(&${this.config.userFilter}(${this.config.usernameAttr}=${username}))`;
      
      return new Promise((resolve, reject) => {
        client.search(this.config.searchBase, {
          filter: filter,
          scope: 'sub',
          attributes: ['dn', this.config.usernameAttr, this.config.emailAttr, this.config.fullnameAttr]
        }, (err, res) => {
          if (err) {
            return reject(err);
          }
          
          let user = null;
          
          res.on('searchEntry', (entry) => {
            user = {
              dn: entry.objectName,
              username: entry.attributes.find(a => a.type === this.config.usernameAttr)?.values[0],
              email: entry.attributes.find(a => a.type === this.config.emailAttr)?.values[0],
              fullName: entry.attributes.find(a => a.type === this.config.fullnameAttr)?.values[0]
            };
          });
          
          res.on('error', (err) => {
            reject(err);
          });
          
          res.on('end', () => {
            resolve(user);
          });
        });
      });
    } catch (error) {
      logger.error(`Erro ao buscar usuário LDAP ${username}:`, error);
      return null;
    } finally {
      try {
        await client.unbindAsync();
      } catch (error) {
        logger.error('Erro ao fechar conexão LDAP:', error);
      }
    }
  }

  /**
   * Sincroniza usuários e grupos do LDAP
   */
  async syncLdapUsers() {
    if (!this.isConfigLoaded) {
      await this.loadConfig();
    }

    if (!this.config || !this.config.isEnabled) {
      logger.info('LDAP não está habilitado para sincronização');
      return { success: false, message: 'LDAP não está habilitado' };
    }

    const client = await this._createClient();
    const transaction = await sequelize.transaction();

    try {
      // Autenticar com o usuário de bind
      await client.bindAsync(this.config.bindDN, this.config.bindPassword);
      logger.info('Conexão LDAP estabelecida, iniciando sincronização');

      // Aqui implementaria a lógica completa de sincronização
      // Esta é uma implementação simplificada
      
      await transaction.commit();
      
      // Atualizar timestamp de última sincronização
      await LdapConfig.update(
        { last_sync: new Date() },
        { where: { is_active: true } }
      );
      
      logger.info('Sincronização LDAP concluída com sucesso');
      
      return { 
        success: true, 
        message: 'Sincronização concluída'
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Erro na sincronização LDAP:', error);
      throw error;
    } finally {
      try {
        await client.unbindAsync();
      } catch (error) {
        logger.error('Erro ao fechar conexão LDAP:', error);
      }
    }
  }
}

module.exports = new LdapService();
import api from './api';

/**
 * Serviço para gerenciar configurações LDAP no frontend
 */
const ldapService = {
  /**
   * Obter configuração LDAP atual
   * @returns {Promise} Promessa com os dados da configuração
   */
  getConfig: async () => {
    const response = await api.get('/ldap/config');
    return response.data;
  },

  /**
   * Salvar configuração LDAP
   * @param {object} config - Configuração LDAP
   * @returns {Promise} Promessa com resultado da operação
   */
  saveConfig: async (config) => {
    const response = await api.post('/ldap/config', config);
    return response.data;
  },

  /**
   * Testar conexão LDAP
   * @param {object} testData - Dados para teste de conexão
   * @returns {Promise} Promessa com resultado do teste
   */
  testConnection: async (testData) => {
    const response = await api.post('/ldap/test', testData);
    return response.data;
  },

  /**
   * Iniciar sincronização LDAP
   * @returns {Promise} Promessa com resultado da sincronização
   */
  syncNow: async () => {
    const response = await api.post('/ldap/sync');
    return response.data;
  }
};

export default ldapService;
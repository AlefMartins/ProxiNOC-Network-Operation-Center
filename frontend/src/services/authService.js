import api from './api';

/**
 * Serviço de autenticação
 */
const authService = {
  /**
   * Realiza o login do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise} Promessa com os dados do usuário e token
   */
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  /**
   * Realiza o logout do usuário
   * @returns {Promise} Promessa com o resultado do logout
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Verifica se o token é válido
   * @returns {Promise} Promessa com os dados do usuário
   */
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  }
};

export default authService;
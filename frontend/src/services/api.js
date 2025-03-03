import axios from 'axios';

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: '/api', // Definido no proxy do Vite
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptador para adicionar o token JWT a todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptador para tratar erros comuns nas respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Verificar se o erro é de autenticação (401)
    if (error.response && error.response.status === 401) {
      // Se não for uma requisição para autenticação, limpar o token
      if (!error.config.url.includes('/auth/')) {
        localStorage.removeItem('token');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
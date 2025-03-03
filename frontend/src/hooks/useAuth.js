import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Hook para acessar o contexto de autenticação
 * @returns {Object} Objeto contendo funções e estados do contexto de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};
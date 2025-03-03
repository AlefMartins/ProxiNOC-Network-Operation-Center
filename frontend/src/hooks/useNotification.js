import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

/**
 * Hook para acessar o contexto de notificação
 * @returns {Object} Objeto contendo funções para exibir notificações
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }

  return context;
};
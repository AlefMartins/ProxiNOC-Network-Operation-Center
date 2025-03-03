import React, { createContext, useCallback } from 'react';
import { useSnackbar } from 'notistack';

// Criar o contexto de notificação
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // Mostrar mensagem de sucesso
  const showSuccess = useCallback((message) => {
    enqueueSnackbar(message, { 
      variant: 'success',
      autoHideDuration: 3000
    });
  }, [enqueueSnackbar]);

  // Mostrar mensagem de erro
  const showError = useCallback((message) => {
    enqueueSnackbar(message, { 
      variant: 'error',
      autoHideDuration: 5000
    });
  }, [enqueueSnackbar]);

  // Mostrar mensagem de informação
  const showInfo = useCallback((message) => {
    enqueueSnackbar(message, { 
      variant: 'info',
      autoHideDuration: 3000
    });
  }, [enqueueSnackbar]);

  // Mostrar mensagem de alerta
  const showWarning = useCallback((message) => {
    enqueueSnackbar(message, { 
      variant: 'warning',
      autoHideDuration: 4000
    });
  }, [enqueueSnackbar]);

  // Fechar todas as notificações
  const closeAll = useCallback(() => {
    closeSnackbar();
  }, [closeSnackbar]);

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showWarning,
        closeAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
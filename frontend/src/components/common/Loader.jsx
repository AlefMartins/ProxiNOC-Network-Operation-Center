import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Componente de carregamento
 * @param {Object} props - Propriedades do componente
 * @param {string} props.message - Mensagem a ser exibida
 * @returns {JSX.Element} Componente de carregamento
 */
const Loader = ({ message = 'Carregando...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: 3
      }}
    >
      <CircularProgress size={60} thickness={4} />
      {message && (
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default Loader;